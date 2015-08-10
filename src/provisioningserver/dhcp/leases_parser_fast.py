# Copyright 2013-2015 Canonical Ltd.  This software is licensed under the
# GNU Affero General Public License version 3 (see the file LICENSE).

"""A speedier version of `leases_parser`.

This extracts the relevant stanzas from a leases file, keeping only the
most recent "host" and "lease" entries, then uses the existing and
properly defined but slow parser to parse them. This massively speeds up
parsing a leases file that contains a modest number of unique host and
lease entries, but has become very large because of churn.
"""

from __future__ import (
    absolute_import,
    print_function,
    unicode_literals,
    )

str = None

__metaclass__ = type
__all__ = [
    'parse_leases',
    ]

from collections import (
    defaultdict,
    OrderedDict,
)
from datetime import datetime
from itertools import chain
import re

from provisioningserver.dhcp.leases_parser import (
    get_host_ip,
    get_host_key,
    get_host_mac,
    has_expired,
    is_host,
    is_lease,
    lease_parser,
)


re_entry = re.compile(
    r'''
    ^\s*              # Ignore leading whitespace on each line.
    (host|lease)      # Look only for host or lease stanzas.
    \s+               # Mandatory whitespace.
    ([0-9a-fA-F.:]+)  # Capture the IP/MAC address for this stanza.
    \s*{              # Optional whitespace then an opening brace.
    ''',
    re.MULTILINE | re.DOTALL | re.VERBOSE)


def find_lease_starts(leases_contents):
    results = defaultdict(dict)
    for match in re_entry.finditer(leases_contents):
        stanza, address = match.groups()
        results[stanza][address] = match.start()
    return chain.from_iterable(
        mapping.itervalues() for mapping in results.itervalues())


def extract_leases(leases_contents):
    starts = find_lease_starts(leases_contents)
    for start in sorted(starts):
        record = lease_parser.scanString(leases_contents[start:])
        try:
            token, _, _ = next(record)
        except StopIteration:
            pass
        else:
            yield token


def parse_leases(leases_contents):
    results = OrderedDict()
    now = datetime.utcnow()
    for entry in extract_leases(leases_contents):
        if is_lease(entry):
            if not has_expired(entry, now):
                results[entry.host] = (entry.hardware.mac, entry.host)
        elif is_host(entry):
            mac = get_host_mac(entry)
            ip = get_host_ip(entry)
            key = get_host_key(entry)
            if ip is None or mac is None:
                if key in results:
                    del results[key]
            else:
                results[key] = (mac, ip)
    return {
        val[1]: val[0] for _, val in results.items()
    }
