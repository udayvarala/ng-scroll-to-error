/**
 * Created by Uday Varala on 4/18/16.
 */

angular.module('ngScrollToError', [])
  .value('ngScrollToErrorConfig', {
    showDebugInfo: true,
    scrollOnAllForms: true,
    focusToErrorField : true
  })
  .directive('form', ['ngScrollToErrorConfig', '$log', '$location', '$anchorScroll', scrollToError])
  .directive('ngForm', ['ngScrollToErrorConfig', '$log', '$location', '$anchorScroll', scrollToError]);

function scrollToError(ngScrollToErrorConfig, $log, $location, $anchorScroll) {
  'use strict';

  function showDebugInfo() {
    if (ngScrollToErrorConfig.showDebugInfo) {
      $log.debug("[ngScrollToError] " + Array.prototype.join.call(arguments, ' '));
    }
  }

  return {
    restrict: 'E',
    require: "form",
    compile: function ngScrollToErrorCompile() {

      return function ngScrollToErrorLinking(scope, iElement, iAttrs, ngFormCtrl) {

        var initialized = false,
          disableScrollOnSubmit = iAttrs.disableScrollOnSubmit === 'true',
          disableFocusOnSubmit = iAttrs.disableFocusOnSubmit === 'true';

        function bindListeners() {

          iElement.bind('submit', eventHandler);

          showDebugInfo("Bound events: submit");
        };

        function unbindListeners() {
          if (!initialized) {
            return;
          }

          iElement.unbind('submit', eventHandler);

          showDebugInfo("Unbound events: submit");
        };

        function eventHandler() {
          if (ngFormCtrl.$invalid) {
            showDebugInfo("Input errors :", ngFormCtrl.$error);

            if (ngScrollToErrorConfig.scrollOnAllForms && !disableScrollOnSubmit) {
              scroll();
            }
          }
        };

        function scroll() {

          var inputNames = {}, topEl, err, i, arr, hasErrors = false, l;

          for (err in ngFormCtrl.$error) {
            if (ngFormCtrl.$error[err] instanceof Array) {
              arr = ngFormCtrl.$error[err], l = ngFormCtrl.$error[err].length;
              hasErrors = true;
              for (i = 0; i < l; i++) {
                if (inputNames[arr[i].$name]) {
                  inputNames[arr[i].$name].validationsFailed.push(err);
                } else {
                  var el = angular.element("[name='" + arr[i].$name + "']"), visibleEl = el;
                   while(!visibleEl.is(':visible')) {
                     visibleEl = visibleEl.parent();
                   }
                  inputNames[arr[i].$name] = {
                    el: el,
                    inputCtrl: arr[i],
                    validationsFailed: [err],
                    offset: visibleEl && visibleEl.offset(),
                    position: visibleEl && visibleEl.position(),
                    visibleEl : visibleEl
                  }
                }
              }

              showDebugInfo("Processed error fields", inputNames);
            } else {
              showDebugInfo("Error Type is not defined")
            }

             if (hasErrors) {
               topEl = getTopElement(inputNames);
               if (ngScrollToErrorConfig.focusToErrorField && !disableFocusOnSubmit && topEl.visibleEl.is(':input')) {
                 topEl.visibleEl.focus();
               } else {
                 $location.hash(topEl.visibleEl.attr('id'));
                 $anchorScroll();
               }
             }

          }

        }

        function getTopElement(inputs) {
          var topEl = null;
          for (var inp in inputs) {

             if (!topEl) {
               topEl = inputs[inp];
             }
            if (inputs[inp].offset) {
              if (inputs[inp].offset.top < topEl.offset.top) {
                topEl = inputs[inp];
              } else if (inputs[inp].offset.top === topEl.offset.top) {
                if (inputs[inp].offset.left < topEl.offset.left) {
                  topEl = inputs[inp];
                }
              }
            } else {
              //TODO - Is this possible ?
            }
          }


           if (!topEl.visibleEl.attr('id')) {
               if (!angular.element("#" + topEl.inputCtrl.$name)) {
                 topEl.visibleEl.attr('id', topEl.inputCtrl.$name.replace(/\./g, ""));
               } else {
                 var randomizer = topEl.el.attr('id') || topEl.el.attr('ng-model');
                  topEl.visibleEl.attr('id', topEl.inputCtrl.$name.replace(/\./g, "") + randomizer.replace(/\./g, ""));
               }
           }
          return topEl;
        }

        function initialize() {
          if (initialized) {
            return;
          }
          showDebugInfo("Initializing");

          bindListeners();

          initialized = true;
        }

        function uninitialize() {
          showDebugInfo("Uninitializing the directive");
          unbindListeners();
          initialized = false;
        };

        scope.$on("$destroy", uninitialize);

        initialize();
      };
    }
  };
}
