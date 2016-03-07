# Copyright 2016 Canonical Ltd.  This software is licensed under the
# GNU Affero General Public License version 3 (see the file LICENSE).

"""Construct sample application data dynamically."""

__all__ = [
    "populate",
]

import random
from socket import gethostname

from maasserver.enum import (
    INTERFACE_TYPE,
    IPADDRESS_TYPE,
    NODE_STATUS,
    NODE_TYPE,
)
from maasserver.models import (
    Fabric,
    Node,
)
from maasserver.testing.factory import factory
from maasserver.utils.orm import (
    get_one,
    transactional,
)
from provisioningserver.utils.ipaddr import get_mac_addresses


@transactional
def populate(seed="sampledata"):
    """Populate the database with example data.

    This should:

    - Mimic a real-world MAAS installation,

    - Create example data for all of MAAS's features,

    - Not go overboard; in general there need be at most a handful of each
      type of object,

    - Have elements of randomness; the sample data should never become
      something we depend upon too closely — for example in QA, demos, and
      tests — and randomness helps to keep us honest.

    If there is something you need, add it. If something does not make sense,
    change it or remove it. If you need something esoteric that would muddy
    the waters for the majority, consider putting it in a separate function.

    This function expects to be run into an empty database. It is not
    idempotent, and will almost certainly crash if invoked multiple times on
    the same database.

    """
    random.seed(seed)

    admin = factory.make_admin(username="admin", password="test")  # noqa
    user1, _ = factory.make_user_with_keys(username="user1", password="test")
    user2, _ = factory.make_user_with_keys(username="user2", password="test")

    # Physical zones.
    zones = [
        factory.make_Zone(name="zone-north"),
        factory.make_Zone(name="zone-south"),
    ]

    # Create the fabrics that will be used by the regions, racks,
    # machines, and devices.
    fabric0 = Fabric.objects.get_default_fabric()
    fabric0_untagged = fabric0.get_default_vlan()
    fabric0_vlan10 = factory.make_VLAN(fabric=fabric0, vid=10)
    fabric1 = factory.make_Fabric()
    fabric1_untagged = fabric1.get_default_vlan()
    fabrics = [fabric0, fabric1]

    # Subnets used by regions, racks, machines, and devices.
    subnet_1 = factory.make_Subnet(
        cidr="192.168.1.0/24", gateway_ip="192.168.1.1",
        vlan=fabric0_untagged)
    subnet_2 = factory.make_Subnet(
        cidr="192.168.2.0/24", gateway_ip="192.168.2.1",
        vlan=fabric1_untagged)
    subnet_3 = factory.make_Subnet(
        cidr="192.168.3.0/24", gateway_ip="192.168.3.1",
        vlan=fabric0_vlan10)

    hostname = gethostname()

    region_rack = get_one(Node.objects.filter(
        node_type=NODE_TYPE.REGION_AND_RACK_CONTROLLER, hostname=hostname))
    # If "make run" executes before "make sampledata", the rack may have
    # already registered.
    if region_rack is None:
        region_rack = factory.make_Node(
            node_type=NODE_TYPE.REGION_AND_RACK_CONTROLLER,
            hostname=hostname, interface=False)

        # Get list of mac addresses that should be used for the region
        # rack controller. This will make sure the RegionAdvertisingService
        # picks the correct region on first start-up and doesn't get multiple.
        mac_addresses = get_mac_addresses()

        def get_next_mac():
            try:
                return mac_addresses.pop()
            except IndexError:
                return factory.make_mac_address()

        # Region and rack controller (hostname of dev machine)
        #   eth0     - fabric 0 - untagged
        #   eth1     - fabric 0 - untagged
        #   eth2     - fabric 1 - untagged - 192.168.2.2/24 - static
        #   bond0    - fabric 0 - untagged - 192.168.1.2/24 - static
        #   bond0.10 - fabric 0 - 10       - 192.168.3.2/24 - static

        eth0 = factory.make_Interface(
            INTERFACE_TYPE.PHYSICAL, name="eth0",
            node=region_rack, vlan=fabric0_untagged,
            mac_address=get_next_mac())
        eth1 = factory.make_Interface(
            INTERFACE_TYPE.PHYSICAL, name="eth1",
            node=region_rack, vlan=fabric0_untagged,
            mac_address=get_next_mac())
        eth2 = factory.make_Interface(
            INTERFACE_TYPE.PHYSICAL, name="eth2",
            node=region_rack, vlan=fabric1_untagged,
            mac_address=get_next_mac())
        bond0 = factory.make_Interface(
            INTERFACE_TYPE.BOND, name="bond0",
            node=region_rack, vlan=fabric0_untagged,
            parents=[eth0, eth1], mac_address=eth0.mac_address)
        bond0_10 = factory.make_Interface(
            INTERFACE_TYPE.VLAN, node=region_rack,
            vlan=fabric0_vlan10, parents=[bond0])
        factory.make_StaticIPAddress(
            alloc_type=IPADDRESS_TYPE.STICKY, ip="192.168.1.2",
            subnet=subnet_1, interface=bond0)
        factory.make_StaticIPAddress(
            alloc_type=IPADDRESS_TYPE.STICKY, ip="192.168.2.2",
            subnet=subnet_2, interface=eth2)
        factory.make_StaticIPAddress(
            alloc_type=IPADDRESS_TYPE.STICKY, ip="192.168.3.2",
            subnet=subnet_3, interface=bond0_10)

    # Rack controller (happy-rack)
    #   eth0     - fabric 0 - untagged
    #   eth1     - fabric 0 - untagged
    #   eth2     - fabric 1 - untagged - 192.168.2.3/24 - static
    #   bond0    - fabric 0 - untagged - 192.168.1.3/24 - static
    #   bond0.10 - fabric 0 - 10       - 192.168.3.3/24 - static
    rack = factory.make_Node(
        node_type=NODE_TYPE.RACK_CONTROLLER,
        hostname="happy-rack", interface=False)
    eth0 = factory.make_Interface(
        INTERFACE_TYPE.PHYSICAL, name="eth0",
        node=rack, vlan=fabric0_untagged)
    eth1 = factory.make_Interface(
        INTERFACE_TYPE.PHYSICAL, name="eth1",
        node=rack, vlan=fabric0_untagged)
    eth2 = factory.make_Interface(
        INTERFACE_TYPE.PHYSICAL, name="eth2",
        node=rack, vlan=fabric1_untagged)
    bond0 = factory.make_Interface(
        INTERFACE_TYPE.BOND, name="bond0",
        node=rack, vlan=fabric0_untagged, parents=[eth0, eth1])
    bond0_10 = factory.make_Interface(
        INTERFACE_TYPE.VLAN, node=rack,
        vlan=fabric0_vlan10, parents=[bond0])
    factory.make_StaticIPAddress(
        alloc_type=IPADDRESS_TYPE.STICKY, ip="192.168.1.3",
        subnet=subnet_1, interface=bond0)
    factory.make_StaticIPAddress(
        alloc_type=IPADDRESS_TYPE.STICKY, ip="192.168.2.3",
        subnet=subnet_2, interface=eth2)
    factory.make_StaticIPAddress(
        alloc_type=IPADDRESS_TYPE.STICKY, ip="192.168.3.3",
        subnet=subnet_3, interface=bond0_10)

    user1_machines = [  # noqa
        factory.make_Node(
            owner=user1, status=NODE_STATUS.ALLOCATED,
            zone=random.choice(zones), fabric=random.choice(fabrics),
        ),
        factory.make_Node(
            owner=user1, status=NODE_STATUS.DEPLOYED,
            zone=random.choice(zones), fabric=random.choice(fabrics),
        ),
    ]
    user2_machines = [  # noqa
        factory.make_Node(
            owner=user2, status=NODE_STATUS.DEPLOYING,
            zone=random.choice(zones), fabric=random.choice(fabrics),
        ),
        factory.make_Node(
            owner=user2, status=NODE_STATUS.RELEASING,
            zone=random.choice(zones), fabric=random.choice(fabrics),
        ),
    ]