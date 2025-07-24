'use strict';

angular.module('github_light', ['ngResource'])
        .filter('releaseNumberFilter', [function () {
            return function (tagText) {
                if (!tagText) {
                    return '';
                }

                // Cut out the version constant from this tag, which is
                // expected to be on the form [text-version].
                var lastDashIndex = tagText.lastIndexOf('-');
                if (lastDashIndex !== -1) {

                    // Cut out the version number, and return it.
                    return tagText.substring(lastDashIndex + 1);
                }

                // Unknown tag format.
                // Simply return the full tag text.
                return tagText;
            };
        }])
        .factory('tagService', ['$resource', function ($resource) {
            return $resource(
                    'https://api.github.com/repos/:owner/:name/:operation',
                    {
                        owner: '@owner',
                        name: '@name',
                        operation: '@operation'
                    },
                    {
                        list: {method: 'GET', params: {operation: 'tags'}, isArray: true}
                    }
            );
        }])
        .factory('docsService', ['tagService', function (tagService) {

            // Internal state
            var toReturn;
            var repoDefinition = function () {

                // repoDefinition scope independant this
                var me = this;

                // Shared state
                me.owner = 'unknown';
                me.name = 'unknown';
                me.tagList = [];
                me.completed = false;

                // Public API
                me.init = function (repoOwner, repoName) {
                    me.owner = repoOwner;
                    me.name = repoName;

                    me.tagList = [];

                    // Find the tag list
                    me.tagListPromise = tagService.list({prop: 'value'}, {owner: me.owner, name: me.name}, function () {
                        toReturn.completed = true;
                    });
                    me.tagListPromise = (me.tagListPromise.$promise || me.tagListPromise).then((function(tags) {
                        // sort jaxb2-maven-plugin below jaxb-maven-plugin
                        tags.sort(function(a, b) {
                            if (a.name.startsWith("jaxb2-")) {
                                return -1;
                            }
                            return 0;
                        });
                        me.tagList = tags;
                    }));

                    // All done.
                    return this;
                };

                /**
                 * @returns {boolean} True if the repo has defined tags, and false otherwise.
                 */
                me.hasTags = function () {
                    return me.tagList.length > 0;
                };
            };

            // All done.
            toReturn = new repoDefinition('unknown', 'unknown');
            return toReturn;
        }]).controller('githubDocController', ['$scope', '$routeParams', '$resource', 'docsService',
    function ($scope, $routeParams, $resource, docsService) {

        // Bind the repoDefinition in the scope.
        // These parameters define:
        //
        // a) The Repo owner ("mojohaus" for all mojohaus repos)
        // b) The Repo name  ("jaxb2-maven-plugin" in this case; use appropriate repo ID)
        $scope.repo = docsService.init('evolvedbinary', 'mojohaus-jaxb-maven-plugin');
    }]);