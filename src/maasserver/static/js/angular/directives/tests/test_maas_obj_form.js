/* Copyright 2016 Canonical Ltd.  This software is licensed under the
 * GNU Affero General Public License version 3 (see the file LICENSE).
 *
 * Unit tests for MAAS object form.
 */

describe("maasObjForm", function() {

    // Load the MAAS module.
    beforeEach(module("MAAS"));

    // Get required angular pieces and create a new scope before each test.
    var $scope, $timeout, $compile, $q;
    beforeEach(inject(function($rootScope, $injector) {
        $scope = $rootScope.$new();
        $timeout = $injector.get("$timeout");
        $compile = $injector.get("$compile");
        $q = $injector.get("$q");
    }));


    // Return the compiled directive.
    function compileDirective(html) {
        html = "<div>" + html + "</div>";
        var directive = $compile(html)($scope);
        $scope.$digest();
        return directive.children(":first");
    }

    // Changes value on field.
    function changeFieldValue(field, val) {
        // Grab focus.
        field.triggerHandler("focus");
        $scope.$digest();

        // Set the new value.
        field.val(val);
        $scope.$digest();

        // Lose focus.
        field.triggerHandler("blur");
        $scope.$digest();
    }

    // Return the list of rendered errors on the field.
    function getFieldErrorList(field) {
        var errors = [];
        var lis = field.siblings("ul.errors").children();
        lis.each(function() {
            errors.push(angular.element(this).text());
        });
        return errors;
    }

    describe("input type=text", function() {

        var directive;
        beforeEach(function() {
            $scope.obj = {};
            $scope.manager = {
                updateItem: jasmine.createSpy().and.returnValue(
                    $q.defer().promise)
            };
            var html = [
                '<maas-obj-form obj="obj" manager="manager">',
                    '<maas-obj-field type="text" key="key" label="Key" ',
                        'placeholder="Placeholder" label-width="two" ',
                        'input-width="three"></maas-obj-field>',
                '</maas-obj-form>'
                ].join('');
            directive = compileDirective(html);
        });

        it("creates input with type 'text'", function() {
            var inputField = angular.element(directive.find("#key"));
            expect(inputField.prop("nodeName")).toBe("INPUT");
            expect(inputField.attr("type")).toBe("text");
        });

        it("sets placeholder", function() {
            var inputField = angular.element(directive.find("#key"));
            expect(inputField.attr("placeholder")).toBe("Placeholder");
        });

        it("adds label with width", function() {
            var labelField = angular.element(directive.find("label"));
            expect(labelField.text()).toBe("Key");
            expect(labelField.hasClass("two-col")).toBe(true);
        });

        it("adds inputWrapper with width", function() {
            var labelField = angular.element(directive.find("label "));
            var inputWrapper = angular.element(labelField.next("div"));
            expect(inputWrapper.hasClass("three-col")).toBe(true);
            expect(inputWrapper.hasClass("last-col")).toBe(true);
        });

        it("reverts value on esc", function() {
            var inputField = angular.element(directive.find("#key"));
            inputField.triggerHandler("focus");
            inputField.val(makeName("newValue"));

            // Send esc.
            var evt = angular.element.Event("keydown");
            evt.which = 27;
            inputField.trigger(evt);

            expect(inputField.val()).toBe("");
        });
    });

    describe("textarea", function() {

        var directive;
        beforeEach(function() {
            $scope.obj = {};
            $scope.manager = {};
            var html = [
                '<maas-obj-form obj="obj" manager="manager">',
                    '<maas-obj-field type="textarea" key="key" label="Key" ',
                        'placeholder="Placeholder" label-width="two" ',
                        'input-width="three"></maas-obj-field>',
                '</maas-obj-form>'
                ].join('');
            directive = compileDirective(html);
        });

        it("creates textarea", function() {
            var textarea = angular.element(directive.find("#key"));
            expect(textarea.prop("nodeName")).toBe("TEXTAREA");
        });

        it("sets placeholder", function() {
            var textarea = angular.element(directive.find("#key"));
            expect(textarea.attr("placeholder")).toBe("Placeholder");
        });

        it("adds label with width", function() {
            var labelField = angular.element(directive.find("label"));
            expect(labelField.text()).toBe("Key");
            expect(labelField.hasClass("two-col")).toBe(true);
        });

        it("adds inputWrapper with width", function() {
            var labelField = angular.element(directive.find("label "));
            var inputWrapper = angular.element(labelField.next("div"));
            expect(inputWrapper.hasClass("three-col")).toBe(true);
            expect(inputWrapper.hasClass("last-col")).toBe(true);
        });
    });

    describe("select", function() {

        var directive, options;
        beforeEach(function() {
            $scope.obj = {};
            $scope.manager = {};
            $scope.options = [{
                id: 0,
                text: "test"
            }];
            options = "option.id as option.text for option in options";
            var html = [
                '<maas-obj-form obj="obj" manager="manager">',
                    '<maas-obj-field type="options" key="key" label="Key" ',
                        'placeholder="Placeholder" label-width="two" ',
                        'input-width="three" options="' + options + '">',
                    '</maas-obj-field>',
                '</maas-obj-form>'
                ].join('');
            directive = compileDirective(html);
        });

        it("creates select", function() {
            var select = angular.element(directive.find("#key"));
            expect(select.prop("nodeName")).toBe("SELECT");
            expect(select.attr("ng-options")).toBe(options);
        });

        it("adds placeholder option", function() {
            var select = angular.element(directive.find("#key"));
            var placeholder = angular.element(select.find('option[value=""]'));
            expect(placeholder.text()).toBe("Placeholder");
        });

        it("adds label with width", function() {
            var labelField = angular.element(directive.find("label"));
            expect(labelField.text()).toBe("Key");
            expect(labelField.hasClass("two-col")).toBe(true);
        });

        it("adds inputWrapper with width", function() {
            var labelField = angular.element(directive.find("label "));
            var inputWrapper = angular.element(labelField.next("div"));
            expect(inputWrapper.hasClass("three-col")).toBe(true);
            expect(inputWrapper.hasClass("last-col")).toBe(true);
        });
    });

    describe("single field", function() {

        var directive, updateItemMethod, saveDefer;
        beforeEach(function() {
            $scope.obj = {
                key: makeName("key")
            };
            saveDefer = $q.defer();
            updateItemMethod = jasmine.createSpy();
            updateItemMethod.and.returnValue(saveDefer.promise);
            $scope.manager = {
                updateItem: updateItemMethod
            };
            var html = [
                '<maas-obj-form obj="obj" manager="manager">',
                    '<maas-obj-field type="text" key="key" label="Key" ',
                        'placeholder="Placeholder" label-width="two" ',
                        'input-width="three"></maas-obj-field>',
                '</maas-obj-form>'
                ].join('');
            directive = compileDirective(html);
        });

        it("sets input to value", function() {
            var field = angular.element(directive.find("#key"));
            expect(field.val()).toBe($scope.obj.key);
        });

        it("updates input to value when not in focus", function() {
            var field = angular.element(directive.find("#key"));
            expect(field.val()).toBe($scope.obj.key);
            $scope.obj.key = makeName("new_key");
            $scope.$digest();
            expect(field.val()).toBe($scope.obj.key);
        });

        it("doesn't update input to value when in focus", function() {
            var field = angular.element(directive.find("#key"));
            expect(field.val()).toBe($scope.obj.key);
            field.triggerHandler("focus");
            $scope.obj.key = makeName("new_key");
            $scope.$digest();
            expect(field.val()).not.toBe($scope.obj.key);
        });

        it("sets 'saving' class on form when value changed", function() {
            var form = angular.element(directive.find("form"));
            var field = angular.element(directive.find("#key"));
            var newKey = makeName("new_key");
            changeFieldValue(field, newKey);
            expect(form.hasClass("saving")).toBe(true);
        });

        it("calls updateItem on form when value changed", function() {
            var field = angular.element(directive.find("#key"));
            var newKey = makeName("new_key");
            changeFieldValue(field, newKey);
            expect(updateItemMethod).toHaveBeenCalledWith({
                key: newKey
            });
        });

        it("doesnt call updateItem on form when no value change", function() {
            var field = angular.element(directive.find("#key"));
            changeFieldValue(field, $scope.obj.key);
            expect(updateItemMethod).not.toHaveBeenCalled();
        });

        it("removes 'saving' class on form when saved", function() {
            var form = angular.element(directive.find("form"));
            var field = angular.element(directive.find("#key"));
            var newKey = makeName("new_key");
            changeFieldValue(field, newKey);
            expect(form.hasClass("saving")).toBe(true);

            saveDefer.resolve($scope.obj);
            $scope.$digest();
            expect(form.hasClass("saving")).toBe(false);
        });

        it("updates the element to the value resolved", function() {
            var form = angular.element(directive.find("form"));
            var field = angular.element(directive.find("#key"));
            changeFieldValue(field, makeName("new_key"));
            expect(form.hasClass("saving")).toBe(true);

            var diffKey = makeName("diff_key");
            saveDefer.resolve({
                key: diffKey
            });
            $scope.$digest();
            expect(field.val()).toBe(diffKey);
        });

        it("sets string error on field", function() {
            var field = angular.element(directive.find("#key"));
            changeFieldValue(field, makeName("new_key"));

            var error = makeName("error");
            saveDefer.reject(error);
            $scope.$digest();

            var errorsList = getFieldErrorList(field);
            expect(errorsList).toEqual([error]);
        });

        it("sets field error on field", function() {
            var field = angular.element(directive.find("#key"));
            changeFieldValue(field, makeName("new_key"));

            var error = makeName("error");
            saveDefer.reject(angular.toJson({
                key: error
            }));
            $scope.$digest();

            var errorsList = getFieldErrorList(field);
            expect(errorsList).toEqual([error]);
            expect(field.hasClass("invalid")).toBe(true);
        });

        it("sets field error on another field", function() {
            var field = angular.element(directive.find("#key"));
            changeFieldValue(field, makeName("new_key"));

            var error = makeName("error");
            saveDefer.reject(angular.toJson({
                otherKey: error
            }));
            $scope.$digest();

            var errorsList = getFieldErrorList(field);
            expect(errorsList).toEqual(["otherKey: " + error]);
            expect(field.hasClass("invalid")).toBe(true);
        });

        it("sets multiple errors on field", function() {
            var field = angular.element(directive.find("#key"));
            changeFieldValue(field, makeName("new_key"));

            var error1 = makeName("error");
            var error2 = makeName("error");
            saveDefer.reject(angular.toJson({
                key: [error1, error2]
            }));
            $scope.$digest();

            var errorsList = getFieldErrorList(field);
            expect(errorsList).toEqual([error1, error2]);
            expect(field.hasClass("invalid")).toBe(true);
        });
    });

    describe("calls preProcess function", function() {

        it("calls preProcess function", function() {
            var preProcess = jasmine.createSpy();
            $scope.obj = {
                key: makeName("key")
            };
            $scope.process = preProcess;
            var saveDefer = $q.defer();
            var updateItemMethod = jasmine.createSpy();
            updateItemMethod.and.returnValue(saveDefer.promise);
            $scope.manager = {
                updateItem: updateItemMethod
            };
            var html = [
                '<maas-obj-form obj="obj" manager="manager" ',
                    'pre-process="process">',
                    '<maas-obj-field type="text" key="key" label="Key" ',
                        'placeholder="Placeholder" label-width="two" ',
                        'input-width="three"></maas-obj-field>',
                '</maas-obj-form>'
                ].join('');
            var directive = compileDirective(html);
            var field = angular.element(directive.find("#key"));
            var newKey = makeName("new_key");
            changeFieldValue(field, newKey);
            expect(preProcess).toHaveBeenCalled();
        });
    });

    describe("multi fields", function() {

        var directive, updateItemMethod, saveDefer;
        beforeEach(function() {
            $scope.obj = {
                key1: makeName("key1"),
                key2: makeName("key2")
            };
            saveDefer = $q.defer();
            updateItemMethod = jasmine.createSpy();
            updateItemMethod.and.returnValue(saveDefer.promise);
            $scope.manager = {
                updateItem: updateItemMethod
            };
            var html = [
                '<maas-obj-form obj="obj" manager="manager">',
                    '<maas-obj-field type="text" key="key1" label="Key1" ',
                        'placeholder="Placeholder" label-width="two" ',
                        'input-width="three"></maas-obj-field>',
                    '<maas-obj-field type="text" key="key2" label="Key2" ',
                        'placeholder="Placeholder" label-width="two" ',
                        'input-width="three"></maas-obj-field>',
                '</maas-obj-form>'
                ].join('');
            directive = compileDirective(html);
        });

        it("sets field error on both fields", function() {
            var field1 = angular.element(directive.find("#key1"));
            var field2 = angular.element(directive.find("#key2"));
            changeFieldValue(field1, makeName("new_key"));

            var error1 = makeName("error");
            var error2 = makeName("error");
            saveDefer.reject(angular.toJson({
                key1: [error1],
                key2: [error2]
            }));
            $scope.$digest();

            expect(getFieldErrorList(field1)).toEqual([error1]);
            expect(getFieldErrorList(field2)).toEqual([error2]);
        });
    });

    describe("grouped fields", function() {

        var directive, updateItemMethod, saveDefer;
        beforeEach(function() {
            $scope.obj = {
                key1: makeName("key1"),
                key2: makeName("key2")
            };
            saveDefer = $q.defer();
            updateItemMethod = jasmine.createSpy();
            updateItemMethod.and.returnValue(saveDefer.promise);
            $scope.manager = {
                updateItem: updateItemMethod
            };
            var html = [
                '<maas-obj-form obj="obj" manager="manager">',
                    '<maas-obj-field-group>',
                        '<maas-obj-field type="text" key="key1" label="Key1" ',
                            'placeholder="Placeholder" label-width="two" ',
                            'input-width="three"></maas-obj-field>',
                        '<maas-obj-field type="text" key="key2" label="Key2" ',
                            'placeholder="Placeholder" label-width="two" ',
                            'input-width="three"></maas-obj-field>',
                    '</maas-obj-field-group>',
                '</maas-obj-form>'
                ].join('');
            directive = compileDirective(html);
        });

        it("doesnt try to save when switching between fields", function() {
            var field1 = angular.element(directive.find("#key1"));
            var field2 = angular.element(directive.find("#key2"));
            changeFieldValue(field1, makeName("new_key"));
            field2.triggerHandler('focus');

            // Flush the all timers to make sure that save is not performed.
            $timeout.flush();

            expect(updateItemMethod).not.toHaveBeenCalled();
        });

        it("saves when both fields lose focus", function() {
            var field1 = angular.element(directive.find("#key1"));
            var field2 = angular.element(directive.find("#key2"));
            var newKey1 = makeName("new_key1");
            var newKey2 = makeName("new_key2");
            changeFieldValue(field1, newKey1);

            // Grab focus then flush to clear the timer from field1.
            field2.triggerHandler("focus");
            $scope.$digest();
            $timeout.flush();

            // Set the new value and lose focus.
            field2.val(newKey2);
            $scope.$digest();
            field2.triggerHandler("blur");
            $scope.$digest();

            // Flush the timer from field2 where save should be called.
            $timeout.flush();

            // Should be called with both fields set to the new value.
            expect(updateItemMethod).toHaveBeenCalledWith({
                key1: newKey1,
                key2: newKey2
            });
        });

        it("doesn't change field value when one being edited", function() {
            var field1 = angular.element(directive.find("#key1"));
            var field2 = angular.element(directive.find("#key2"));

            // Grab the focus of the first field.
            field1.triggerHandler('focus');
            $scope.$digest();

            // Change the value of field2 in the scope.
            var oldField2Value = $scope.obj.key2;
            var newField2Value = makeName("new_key2");
            $scope.obj.key2 = newField2Value;
            $scope.$digest();

            // Check that field2 still has the old value.
            expect(field2.val()).not.toBe(newField2Value);
            expect(field2.val()).toBe(oldField2Value);
        });
    });
});