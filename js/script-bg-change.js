angular.module('app.globalmethods', [])

.run(function($state, $rootScope, $mdDialog, $cacheFactory, site, UserDataServices, GoalsDataServices, User, Post, CommentDataServices, FileService, TagsDataServices, PrivacyServices, CategoriesServices, $sce, NotificationDataServices, $filter) {

    $rootScope.$state = $state;

    $rootScope.site_url = function(path) {
        return site.url(path);
    }

    $rootScope.createGoal = function(ev, data) {
        var data = data || {}
        $mdDialog.show({
            controller: CreateGoalCtrl,
            templateUrl: 'partials/sub-partials/goal-modal-create.tmpl',
            //targetEvent: ev,
            locals: {
                predata: data
            }
        })
    };

    $rootScope.editGoal = function(ev) {
        $mdDialog.show({
            controller: DialogController,
            templateUrl: 'partials/sub-partials/goal-modal-edit.tmpl',
            targetEvent: ev,
        })
    };

    $rootScope.linkGoal = function(ev) {
        $mdDialog.show({
            controller: DialogController,
            templateUrl: 'partials/sub-partials/goal-modal-link.tmpl',
            targetEvent: ev,
        })
    };

    $rootScope.loginSignupModal = function(index) {
        var index = index || 0;
        $mdDialog.show({
            controller: 'LoginSignupCtrl',
            templateUrl: 'partials/sub-partials/login-signup-modal.tmpl',
            //targetEvent: ev,
            locals: {
                index: index
            }
        })
    };

    $rootScope.LinkUnLinkGoalWithMyGoal = function(goal) {
        $mdDialog.show({
            templateUrl: 'partials/sub-partials/manage-link-goals-modal.tmpl',
            locals: { goal: goal },
            controller: ['$scope', '$rootScope', 'goal', 'GoalsDataServices', function($scope, $rootScope, goal, GoalsDataServices) {
                $scope.goal = goal;
                $scope.cancel = function() {
                    $mdDialog.hide();
                }

                $scope.searchGoal = '';
                $scope.loadMyGoals = function() {
                    var offset = 0;
                    var limit = 20;
                    UserDataServices.getMyGoalsLinks($scope.goal.id, { offset: offset, limit: limit }).success(function(result) {
                        $scope.myLinkedGoals = result.data;
                    })
                }
                $scope.loadMyGoals();

                $scope.actionGoal = function(goal) {
                    GoalsDataServices.linkUnlink($scope.goal.id, goal.id, goal.isLinked).success(function(res) {
                        goal.isLinked = (goal.isLinked == 1) ? 0 : 1;
                        var totalGoalsLinked = 0;
                        angular.forEach($scope.myLinkedGoals, function(v, key){
                            if ((v.isLinked == 1)) {
                                totalGoalsLinked = totalGoalsLinked + 1;
                            }
                        });

                        if (totalGoalsLinked > 0) {
                            console.log(totalGoalsLinked)
                            $scope.goal.me.isLinked = 1
                        } else {
                            console.log(totalGoalsLinked)
                            $scope.goal.me.isLinked = 0
                        }

                        if (res.meta.status !== 200) {
                            $rootScope.Notify.UImessage("Unlink Failed", "error", "right", 'top');
                        } else {
                            //goal.me.isLinked = 0;
                        }
                    })
                }
            }]
        })
    };

    $rootScope.followUnfollowUser = function(user) {
        var isFollowing = user.me.isFollowing;
        if (user.me.isFollowing == 0) {
            user.me.isFollowing = 1;
        } else {
            user.me.isFollowing = 0;
        }
        UserDataServices.followUnfollowUser(user.uid, isFollowing).success(function(res) {
            if (res.meta.status == 200) {
                if (user.me.isFollowing == 1) {
                    $rootScope.Notify.UImessage("You are now following " + user.name, "info", "right");
                } else {
                    $rootScope.Notify.UImessage("You unfollowed " + user.name, "info", "right");
                }
            } else {
                $rootScope.Notify.UImessage("Failed Operation", "error", "right");
            }
        });
    }

    $rootScope.followUnfollowGoal = function(goal) {
        if (goal.me.isFollower == 0) {
            goal.me.isFollower = 1;
            goal.stats.followers = goal.stats.followers + 1;
            GoalsDataServices.followUnfollow(goal.id, 0);
        } else {
            goal.me.isFollower = 0;
            goal.stats.followers = goal.stats.followers - 1;
            GoalsDataServices.followUnfollow(goal.id, 1);
        }
    }

    $rootScope.postFollowUnfollow = function(post) {
        if (post.me.isFollower == 0) {
            Post.followUnfollow(post.id, 0)
                .success(function() {
                    post.me.isFollower = 1;
                    $rootScope.Notify.UImessage("You are now subscribed", "info", "right", 'top');
                })
                .error(function() {
                    $rootScope.Notify.UImessage("There was an error please try in a while", "error", "right", 'top');
                })

        } else {
            Post.followUnfollow(post.id, 1)
                .success(function() {
                    post.me.isFollower = 0;
                    $rootScope.Notify.UImessage("Successfully unsubscribed", "info", "right", 'top');
                })
                .error(function() {
                    $rootScope.Notify.UImessage("There was an error please try in a while", "error", "right", 'top');
                })
        }
    }
    $rootScope.deletePost = function(activity, index, ev) {
        $mdDialog.show({
            templateUrl: 'partials/sub-partials/deleteConfirm.tmpl',
            controller: function($scope) {
                $scope.title = 'Are you sure you want to delete this?';
                $scope.ok = 'Delete';
                $scope.confirm = function() {
                    $scope.isLoading = true;
                    Post.delete(activity.post.id).success(function(res) {
                        $mdDialog.cancel();
                        $rootScope.Notify.UImessage("Successfully deleted", "success", "right", 'top');
                        $rootScope.$broadcast('event.delete.post', { index: index, event: ev || null, activity: activity })
                        $scope.isLoading = false;
                    })
                    .error(function(err) {
                        $mdDialog.cancel();
                        $rootScope.Notify.UImessage(err.meta.message, "error", "right", 'top');
                        $scope.isLoading = false;
                    })
                }
                $scope.cancel = function() {
                    $mdDialog.cancel();
                }
            },
            targetEvent: ev
        })
    };

    $rootScope.addRemoveInterestTag = function(tag) {
        var id = tag.id || 0;
        if (tag.isMyInterest == 0) {
            tag.isMyInterest = 1;
            UserDataServices.addUserInterest(User.me().uid, id).success(function(result) {
                //
            })
        } else {
            tag.isMyInterest = 0;
            UserDataServices.removeUserInterest(User.me().uid, id).success(function(result) {
                //
            })
        }
    }

    $rootScope.linkUnlinkGoal = function(id, goal) {
        $rootScope.LinkUnLinkGoalWithMyGoal(goal);
    }

    $rootScope.motivateOnGoal = function(goal) {
        if (goal.me.isMotivated == 0) {
            goal.me.isMotivated = 1;
            goal.stats.motivations = goal.stats.motivations + 1;
            GoalsDataServices.motivate(goal.id, 0);
        } else if (goal.me.isMotivated == 1) {
            goal.me.isMotivated = 0;
            goal.stats.motivations = goal.stats.motivations - 1;
            GoalsDataServices.motivate(goal.id, 1);
        }
    }

    $rootScope.motivationOnPost = function(post) {
        if (post.me.isMotivated == 0) {
            post.me.isMotivated = 1;
            post.stats.motivations = post.stats.motivations + 1;
            Post.motivate(post.id, 0)
        } else if (post.me.isMotivated == 1) {
            post.me.isMotivated = 0;
            post.stats.motivations = post.stats.motivations - 1;
            Post.motivate(post.id, 1)
        }
    }

    $rootScope.isMe = function(id) {
        if (id === User.getLoggedInUserId()) {
            return true;
        } else {
            return false;
        }
    }

    $rootScope.notMeAndNotLoggedIn = function(id) {
        if (User.isAuthenticated()) {
            return $rootScope.isMe(id) ? false : true;
        } else {
            return false;
        }
    }

    $rootScope.isLoggedIn = function() {
        return User.isAuthenticated();
    }


    $rootScope.me = function() {
        return User.me();
    }

    $rootScope.isMeOwner = function(uid) {
        return (uid === User.getLoggedInUserId()) ? true : false;
    }

    $rootScope.getUserList = function(id, type, ev) {
        $mdDialog.show({
            templateUrl: 'partials/sub-partials/profile-modal.tmpl',
            controller: ['$scope', 'UserDataServices', 'ScrollService', 'GoalsDataServices', 'Post', '$q', '$timeout', function($scope, UserDataServices, ScrollService, GoalsDataServices, Post, $q, $timeout) {

                switch (type) {
                    case "user-followers":
                        $scope.title = "Followers";

                        $scope.users = [];
                        var offset = 0;
                        var limit = 5;
                        $scope.scrolldisabled = false;

                        $scope.loadMoreUsers = function() {
                            $scope.loading = true;
                            ScrollService.loadMoreFollowers(id, $scope, offset, limit)
                            offset = offset + limit;
                        }

                        $scope.loadMoreUsers();
                        break;
                    case "user-following":
                        $scope.title = "Following";
                        $scope.users = [];
                        var offset = 0;
                        var limit = 5;
                        $scope.scrolldisabled = false;

                        $scope.loadMoreUsers = function() {
                            $scope.loading = true;
                            ScrollService.loadMoreFollowings(id, $scope, offset, limit)
                            offset = offset + limit;
                        }
                        $scope.loadMoreUsers();
                        break;
                    case "mutual-followers":
                        $scope.title = "Mutual Followers"
                        $scope.users = [];
                        var offset = 0;
                        var limit = 5;
                        $scope.scrolldisabled = false;

                        $scope.loadMoreUsers = function() {
                            $scope.loading = true;
                            ScrollService.loadMoreMutualFollowings(id, $scope, offset, limit)
                            offset = offset + limit;
                        }
                        $scope.loadMoreUsers();
                        break;
                    case "goal-followers":
                        $scope.title = "Goal Followers"
                        $scope.users = [];
                        var offset = 0;
                        var limit = 5;
                        $scope.scrolldisabled = false;

                        $scope.loadMoreUsers = function() {
                            $scope.loading = true;
                            ScrollService.loadMoreGoalFollowers(id, $scope, offset, limit)
                            offset = offset + limit;
                        }
                        $scope.loadMoreUsers();
                        break;
                    case "goal-linkers":
                        $scope.title = "Linkers";
                        GoalsDataServices.getLinkers(id).success(function(result) {
                            $scope.users = result.data.users;
                            $scope.loading = false;
                        })
                        break;
                    case "goal-motivators":
                        $scope.title = "Motivators";
                        GoalsDataServices.getMotivators(id).success(function(result) {
                            $scope.users = result.data.users;
                            $scope.loading = false;
                        })
                        break;
                    case "post-motivators":
                        $scope.title = "Motivators"
                        $scope.users = [];
                        var offset = 0;
                        var limit = 5;
                        $scope.scrolldisabled = false;

                        $scope.loadMoreUsers = function() {
                            $scope.loading = true;
                            ScrollService.loadMorePostMotivators(id, $scope, offset, limit)
                            offset = offset + limit;
                        }
                        $scope.loadMoreUsers();

                        // $scope.title = "Motivators";
                        // Post.getMotivators(id).success(function(result) {
                        //     $scope.users = result.data.users;
                        //     $scope.loading = false;
                        // })
                        break;
                }
                $scope.close = function() {
                    $mdDialog.hide();
                }

                $scope.closeOnClick = function(event) {
                    key = event.metaKey || event.ctrlKey || event.shiftKey;
                    if (!(key == true)) {
                        $scope.close();
                    }
                }
            }]
        })
    }

    $rootScope.contributeOnActivity = function(activity) {
        if (activity.newcomment != undefined || activity.file != null) {
            activity.isPosting = true;
            var params = { comment_txt: activity.newcomment, comment_type: "TEXT" }
            if (activity.file != null) {
                params.attach_id = activity.file.fileId;
            }

            CommentDataServices.post(activity.post.id, params).success(function(result) {
                activity.newcomment = undefined;
                activity.file = null;
                activity.fileAttached = false;
                activity.isPosting = false;
                activity.post.stats.comments = activity.post.stats.comments + 1;
                activity.post.comments.push(result.data);
                // $rootScope.Notify.UImessage("","info","right",'top'); // action toast
                // $rootScope.Notify.UImessage("","info","left",'bottom'); //Comment toast
            });
        }
    }

    $rootScope.deleteComment = function(comment, activity, ev) {
        $mdDialog.show({
            templateUrl: 'partials/sub-partials/deleteConfirm.tmpl',
            controller: function($scope) {
                $scope.title = 'Are you you you want to delete this comment?';
                $scope.ok = 'Delete';
                $scope.confirm = function() {
                    $scope.isLoading = true;
                    CommentDataServices.delete(comment.id).success(function() {
                        $mdDialog.cancel();
                        activity.post.stats.comments = activity.post.stats.comments - 1;
                        activity.post.comments.splice(activity.post.comments.indexOf(comment), 1);
                        $scope.isLoading = false;
                    })
                }
                $scope.cancel = function() {
                    $mdDialog.cancel();
                }
            },
            targetEvent: ev
        })
    }

    $rootScope.onContributionFileSelected = function(files, activity) {
        if (files == null || files[0] == undefined) return;
        activity.fileAttached = true;
        FileService.setType("comment");
        FileService.uploadFile(files[0]).then(function(result) {
            activity.file = result.data.data;
        }, function() {
            activity.fileAttached = false;
            $rootScope.Notify.UImessage("There was an error please try in a while", "error", "right", 'top');
        })
    }

    $rootScope.removePreviewContributionFile = function(activity) {
        activity.file = null;
        activity.fileAttached = false;
    }

    $rootScope.getActivityContributions = function(activity, ev) {

        CommentDataServices.getAll(activity.post.id).success(function(result) {
            activity.post.comments = activity.post.comments.concat(result.data);
            $(ev.target).parents('.lg-contrib-box').remove()
        });
    }



    $rootScope.focusOnContribution = function(ev) {
        $(ev.target).parents('.lg-contribution-box').children('.lg-input-box').addClass('highlight');
        $(ev.target).parents('.lg-contribution-box').children('.lg-input-box').removeClass('ds-none');
        $(ev.target).parents('.lg-contribution-box').children('.lg-input-box').find('.input-field-full').focus();
        setTimeout(function() {
            $(ev.target).parents('.lg-contribution-box').children('.lg-input-box').removeClass('highlight');
        }, 1000);
    }

    $rootScope.locationAddressFix = function(place) {
        if (place == undefined) return {};

        var userLocation = {};
        var componentForm = { street_number: 'short_name', route: 'long_name', locality: 'long_name', administrative_area_level_1: 'short_name', country: 'long_name', postal_code: 'short_name' };

        if (place.address_components == undefined) return {}
        for (var i = 0; i < place.address_components.length; i++) {
            var addressType = place.address_components[i].types[0];
            if (componentForm[addressType]) {
                userLocation[addressType] = place.address_components[i][componentForm[addressType]]
            }
        }
        userLocation.latitude = place.geometry.location.lat;
        userLocation.longitude = place.geometry.location.lng;
        userLocation.formatted_address = place.formatted_address

        return userLocation;
    }

    $rootScope.getNotification = function() {
        NotificationDataServices.get({offset: 0, limit: 1}).success(function(result){
            var notification = result.data.notifications[0];
            var time = $filter('readableTime')(notification.created);
            var text = $filter('notificationHighlight')(notification.title.text,notification.title.entities[0].offset,notification.title.entities[0].length )
            var temp =  '<div>' +
                            '<a href="' + notification.link+ '" class="lg-notify-link lg-relative" ng-class="notification.read == 0 ? \'lg-unread\':\'\'">'+
                              '<div layout="row" layout-wrap>' +
                                '<div flex="5" class="lg-min-wid-40"><img class="lg-user-img lg-medium lg-vt-align" src="'+ notification.actor_user.profile.small+ '" alt="'+ notification.actor_user.name+ '" /></div>'+
                                '<div flex>'+
                                  '<div class="lg-inline-bl">'+
                                      '<div class="lg-notify-list">'+
                                          '<span>' + text+ ' </span>'+
                                      '</div>'+
                                      '<div class="lg-time">'+ time + '</div>'+
                                  '</div>'+
                                '</div>'+
                              '</div>'
                            '</a>'
                        '</div>';
            $rootScope.Notify.UImessage(temp, "info", "left", 'bottom');
        })
    }


    if ($rootScope.isLoggedIn()) {
        var appCache = $cacheFactory('app-cache');
        var privacyOptions = appCache.get('privacyOptions');
        var goalCategories = appCache.get('goalCategories');

        if (!privacyOptions) {
            PrivacyServices.getSettings().success(function(result) {
                appCache.put("privacyOptions", result.data);
                $rootScope.privacyOptions = result.data
            })
        } else {
            $rootScope.privacyOptions = appCache.get('privacyOptions');
        }

        if (!goalCategories) {
            CategoriesServices.getAll().success(function(result) {
                appCache.put("goalCategories", result.data);
                $rootScope.goalCategories = result.data
            })
        } else {
            $rootScope.goalCategories = appCache.get('goalCategories');
        }
    }

})

.run(function($rootScope, Notify, $sce) {
    $rootScope.Notify = Notify;
    $rootScope.$sce = $sce;
    $rootScope.customModalOpen = false;

    $rootScope.$on("custom-model:open", function() {
        $rootScope.customModalOpen = true;
    })

    $rootScope.$on("custom-model:close", function() {
        $rootScope.customModalOpen = false;
    })
})
;angular.module('app.chat', [])

.config(function($stateProvider) {
    $stateProvider
        .state('app.message-conv', {
            url: '/messages/conversation/:id',
            templateUrl: 'partials/messages.html',
            controller: 'MessagingConvoCtrl',
            reloadOnSearch: false,
            resolve: {
                loginRequired: function(User) {
                    return User.loginRequired();
                }
            }
        })
})

.run(function($rootScope, $anchorScroll, ChatFactory) {
    if ($rootScope.isLoggedIn()) {
        $rootScope.chatFactory = new ChatFactory();
        $rootScope.chatFactory.login();
        $rootScope.chatFactory.reload().then(function(res) {});
    }

    $anchorScroll.yOffset = 50;
})

.factory('socket', function($rootScope, lagConfig) {
    var socket = io.connect(lagConfig.socket);
    return {
        on: function(eventName, callback) {
            socket.on(eventName, function() {
                var args = arguments;
                $rootScope.$apply(function() {
                    callback.apply(socket, args);
                });
            });
        },
        emit: function(eventName, data, callback) {
            socket.emit(eventName, data, function() {
                var args = arguments;
                $rootScope.$apply(function() {
                    if (callback) {
                        callback.apply(socket, args);
                    }
                });
            })
        }
    };
})

.factory('ChatFactory', function(socket, User, $location, $q, $timeout, $mdDialog, $stateParams, $rootScope) {
    var Chat = function() {
        this.mainObj = {};
        this.mainObj.user = [];
        this.mainObj.chatSpecific = {};
        this.last_conversation_id = '';
        this.current_conversation_id = '';
        this.show = 0;
        this.chatObject = {};
        this.currentUser = {};
        this.chatProfileObject = {};
        this.show2 = true;
        this.status = {
            loading: true,
            loaded: false
        };
        this.onChat = true;
        this.newMessage = false;
        this.msg_txt = '';
        this.selectedItem = {};
        this.total_seen = 0;
        this.sessionUser = User.me();
        this.seen = false;
        this.istyping = false;
        this.istypingUser = {};
        this.TypeTimer;
        this.TypingInterval = 100;
        this.istypingText = '';
        this.istypingConvo = '';
        this.seo = {};




        socket.on('receiveOfflineStatus', function(data) {
            //console.log('on receiveOfflineStatus', data);
            for (var i = 0; i < this.mainObj.user.length; i++) {
                if (this.mainObj.user[i].user.uid == data.data.uid) {
                    this.mainObj.user[i].user = data.data;
                }
            }
        }.bind(this));

        socket.on('receive_UserTyping', function(data) {
            //console.log(data)
            if ((this.sessionUser.uid != data.data.user.uid) && (data.data.conversationId == this.show)) {
                if (data.data.user.uid == this.mainObj.chatSpecific[data.data.conversationId].user.uid) {
                    this.istyping = true;
                    this.istypingText = data.data.message;
                    this.istypingConvo = data.data.conversationId;
                }

            } else {
                this.istyping = false;
            }
            // this.istypingUser = data.data.user;
            // this.istyping = true;
        }.bind(this));


        // socket.on('receiveIsTypingStatus', function(data) {
        //     console.log('on receiveIsTypingStatus', data);
        //     this.istyping = true;

        // }.bind(this));
        //Listen User Offline Messages  Event
        // socket.on('receiveOfflineMessages', function(data) {
        //     this.mainObj.user = [];
        //     this.total_seen = 0;
        //     if (data.data.length != 0) {
        //         for (var i = 0; i < data.data.length; i++) {
        //             if (data.data[i].chat.length != 0) {
        //                 this.mainObj.user.push({ key: data.data[i].chat[0].conversationId, user: data.data[i].user, me: User.me(), index: i, lastMessageId: data.data[i].chat[data.data[i].chat.length - 1].createdTime })
        //                 this.mainObj.chatSpecific[data.data[i].chat[0].conversationId] = data.data[i].chat;
        //                 this.mainObj.chatSpecific[data.data[i].chat[0].conversationId].user = data.data[i].user;
        //                 this.total_seen = data.data[i].chat[data.data[i].chat.length - 1].seen == false ? this.total_seen + 1 : this.total_seen + 0;
        //             }
        //         }

        //         if (typeof data.data[0].chat != "undefined") {
        //             last_conversation_id = data.data[0].chat[0].conversationCreatedTime;
        //         }
        //     }
        // }.bind(this));

        //event of receive notifications
        socket.on('receive_notification', function(data) {
            //event of receive notifications
            //console.log(data)
            $rootScope.getNotification();
        })

        socket.on('receiveScrollChatMessages', function(data) {
            //console.log('on receiveScrollChatMessages', data);
            if (typeof data.data[0] != "undefined") {
                for (var i = data.data[0].chat.length - 1; i >= 0; i--) {
                    this.chatObject.unshift(data.data[0].chat[i])
                }
                this.status.loading = false;
                this.status.loaded = true;
            } else {
                this.status.loading = false;
                this.status.loaded = true;
            }
        }.bind(this))

        socket.on('receiveChatMessage', function(data) {
            //console.log('on receiveChatMessage', data)
            this.seen = false;
            this.istyping = false;

            if (typeof this.mainObj.chatSpecific[data.data.chat.conversationId] == "undefined") {
                this.mainObj.chatSpecific[data.data.chat.conversationId] = [data.data.chat];

                if (User.me().uid == data.data.chat.senderId) {
                    this.mainObj.user.unshift({ key: data.data.chat.conversationId, user: data.data.receiver[0], me: data.data.user, index: 0 })
                    this.mainObj.chatSpecific[data.data.chat.conversationId][this.mainObj.chatSpecific[data.data.chat.conversationId].length - 1].seen = true;
                    this.mainObj.chatSpecific[data.data.chat.conversationId].user = data.data.receiver[0];
                    var url = '/messages/conversation/' + data.data.chat.conversationId;
                    if (this.onChat == false) {
                        this.chatOnProfile(data.data.receiver[0].uid)
                    } else {
                        this.chat(data.data.chat.conversationId, 0)
                    }
                } else {
                    this.mainObj.user.unshift({ key: data.data.chat.conversationId, user: data.data.user, me: data.data.receiver[0], index: 0 })
                    this.mainObj.chatSpecific[data.data.chat.conversationId].user = data.data.user;
                    this.total_seen += 1;
                }

            } else {
                this.mainObj.chatSpecific[data.data.chat.conversationId].push(data.data.chat);
                this.mainObj.user.move(this.mainObj.user, 0, data.data.chat.conversationId);
                if (User.me().uid == data.data.chat.senderId) {
                    this.mainObj.chatSpecific[data.data.chat.conversationId][this.mainObj.chatSpecific[data.data.chat.conversationId].length - 1].seen = true;
                } else {
                    var url = '/messages/conversation/' + data.data.chat.conversationId;
                    if ($location.path() != url) {
                        if (this.mainObj.chatSpecific[data.data.chat.conversationId][this.mainObj.chatSpecific[data.data.chat.conversationId].length - 2].seen == true) {
                            this.total_seen += 1;
                        }
                        this.mainObj.chatSpecific[data.data.chat.conversationId][this.mainObj.chatSpecific[data.data.chat.conversationId].length - 1].seen = false;
                    } else {
                        this.mainObj.chatSpecific[data.data.chat.conversationId][this.mainObj.chatSpecific[data.data.chat.conversationId].length - 1].seen = true;
                        var msgSeenObj = {
                            uId: User.me().uid,
                            messageIds: []
                        };
                        msgSeenObj.messageIds.push(this.mainObj.chatSpecific[data.data.chat.conversationId][this.mainObj.chatSpecific[data.data.chat.conversationId].length - 1].messageId);
                        socket.emit('messageseen', msgSeenObj, function(result) {
                            this.user_msg = "";
                        });
                    }
                }
            }

        }.bind(this));

        socket.on('receiveSearchConversation', function(data) {
            //console.log(data.data)
            if (data.data.length != 0) {
                this.chat(data.data[0].chat[0].conversationId, 0);
                changeRoute('/messages/conversation/' + data.data[0].chat[0].conversationId);
                this.currentUser = data.data[0].user;
                this.seo = {
                    title : this.currentUser.name + " - Messages - Linkagoal"
                };
            }

        }.bind(this))

        socket.on('receiveMessageDeleteStatus', function(data) {
            // console.log('on receiveMessageDeleteStatus', data)
            var conv_id = this.chatObject[0].conversationId;
            this.chatObject.splice(-1, 1);
            if (this.chatObject.length == 0) {
                for (var i = 0; i < this.mainObj.user.length; i++) {
                    if (this.mainObj.user[i].key == conv_id) {
                        this.mainObj.chatSpecific[this.mainObj.user[i].key] = undefined;
                        this.mainObj.user.splice(i, 1);
                    }
                }
                if (typeof this.mainObj.user[0] != "undefined") {
                    this.chat(this.mainObj.user[0].key, -1);
                } else {
                    changeRoute('/messages/conversation/');
                    this.currentUser = {};
                    this.seo = {
                        title : 'Messages - Linkagoal'
                    }
                    this.show2 = true;
                }
            }
        }.bind(this));

        socket.on('receiveMessageSeenStatus', function(data) {
            // console.log('on receiveMessageSceneStatus', data);
            this.seen = true;
            this.total_seen = parseInt(this.total_seen - 1);
        }.bind(this));
    };

    var changeRoute = function(url, forceReload) {
        $location.path(url);
    };

    Chat.prototype.loadMore = function(query) {
        var deferred = $q.defer();
        this.status.loaded = true;
        if (this.status.loading) {
            this.status.loading = false;
            $timeout(function() {
                if (typeof this.chatObject != "undefined") {
                    var finalObj = {
                        uId: User.me().uid,
                        messageCreated: this.chatObject[0].messageId,
                        conversationId: this.current_conversation_id
                    }
                    socket.emit('scroll_chat_messages', finalObj, function(result) {});
                    deferred.resolve();
                }
            }.bind(this), 1000);
        } else {
            this.status.loading = false;
            deferred.reject();
        }

        return deferred.promise;
    };

    Chat.prototype.chat = function(i, index) {
        this.current_conversation_id = i;
        this.show2 = false;
        this.show = i;
        this.newMessage = false;
        this.seen = false;
        this.istyping = false;

        if (typeof this.mainObj.chatSpecific[i] != "undefined") {
            //this.mainObj.chatSpecific[i][this.mainObj.chatSpecific[i].length - 1].seen = true;
            this.chatObject = this.mainObj.chatSpecific[i];
            if (typeof this.mainObj.user[index] != "undefined") {
                this.currentUser = this.mainObj.user[index].user;
                this.seo = {
                    title: this.currentUser.name + " - Messages - Linkagoal"
                };
                changeRoute('/messages/conversation/' + i);
                this.loadMore();
                //Emit Message Seen Event
                if (this.mainObj.chatSpecific[i][this.mainObj.chatSpecific[i].length - 1].seen != true) {
                    this.mainObj.chatSpecific[i][this.mainObj.chatSpecific[i].length - 1].seen = true;
                    var msgSeenObj = {
                        uId: User.me().uid,
                        messageIds: []
                    };
                    for (var j = 0; j < this.chatObject.length; j++) {
                        if (this.chatObject[j].senderId == this.currentUser.uid) {
                            msgSeenObj.messageIds.push(this.chatObject[j].messageId);
                        }
                    }
                    socket.emit('messageseen', msgSeenObj, function(result) {
                        this.user_msg = "";
                    });
                }

            } else {
                this.currentUser = this.mainObj.chatSpecific[i].user;
                this.seo = {
                    title: this.currentUser.name + " - Messages - Linkagoal"
                };
                changeRoute('/messages/conversation/' + i);
                this.loadMore();
                //Emit Message Seen Event
                if (this.mainObj.chatSpecific[i][this.mainObj.chatSpecific[i].length - 1].seen != true) {
                    this.mainObj.chatSpecific[i][this.mainObj.chatSpecific[i].length - 1].seen = true;
                    var msgSeenObj = {
                        uId: User.me().uid,
                        messageIds: []
                    };
                    for (var j = 0; j < this.chatObject.length; j++) {
                        if (this.chatObject[j].senderId == this.currentUser.uid) {
                            msgSeenObj.messageIds.push(this.chatObject[j].messageId);
                        }
                    }
                    socket.emit('messageseen', msgSeenObj, function(result) {
                        this.user_msg = "";
                    });
                }
            }
        }
    };

    Chat.prototype.chatOnProfile = function(uid) {
        for (var i = 0; i < this.mainObj.user.length; i++) {
            if (this.mainObj.user[i].user.uid == uid) {
                key = this.mainObj.user[i].key;
            }
        }

        if (typeof this.mainObj.chatSpecific[key] != "undefined") {
            this.chatProfileObject = this.mainObj.chatSpecific[key];
            if (this.mainObj.chatSpecific[key][this.mainObj.chatSpecific[key].length - 1].seen != true) {
                this.mainObj.chatSpecific[key][this.mainObj.chatSpecific[key].length - 1].seen = true;
                var msgSeenObj = {
                    uId: User.me().uid,
                    messageIds: []
                };
                for (var j = 0; j < this.chatProfileObject.length; j++) {
                    if (this.chatProfileObject[j].senderId == uid) {
                        msgSeenObj.messageIds.push(this.chatProfileObject[j].messageId);
                    }
                }
                socket.emit('messageseen', msgSeenObj, function(result) {
                    this.user_msg = "";
                });
            }
        } else {
            this.chatProfileObject = null;
        }
    }

    Chat.prototype.showNewMessage = function() {
        this.newMessage = true;
        this.show = 0;
        this.show2 = true;
        this.currentUser = undefined;
        this.msg_txt = ''
    }

    Chat.prototype.SendMessage = function(value, key, user) {
        this.istyping = false;
        if (typeof value != "undefined" && (value != "")) {
            var messages = {
                msgFrom: parseInt(User.me().uid),
                msgTo: parseInt(user.uid),
                msgContent: value
            };
            socket.emit('msg', messages, function(result) {});

            key.msg_txt = "";
        }
    };

    Chat.prototype.Typing = function() {

        if (typeof this.chatObject[0] != "undefined") {

            var userTypingObj = {
                uId: this.sessionUser.uid,
                conversationId: this.chatObject[0].conversationId,
                message: ""
            }

            socket.emit('user_typing', userTypingObj, function(result) {

            });
        }
    };

    Chat.prototype.keyup = function() {
        $timeout.cancel(this.TypeTimer);
        this.TypeTimer = $timeout(function() {
            var userTypingObj = {
                uId: this.sessionUser.uid,
                conversationId: this.current_conversation_id,
                message: ""
            }
            socket.emit('user_typing', userTypingObj, function(result) {

            }); //sending data to server
        }.bind(this), 1000);
    };

    Chat.prototype.keydown = function() {
        $timeout.cancel(this.TypeTimer);
    };

    Chat.prototype.change = function() {
        //$scope.counter++;
        var userTypingObj = {
            uId: this.sessionUser.uid,
            conversationId: this.current_conversation_id,
            message: this.sessionUser.name + " is typing"
        }
        $timeout.cancel(this.TypeTimer);
        socket.emit('user_typing', userTypingObj, function(result) {

        }); //sending data to server //sending data to server
    };

    Chat.prototype.blur = function() {
        $timeout.cancel(this.TypeTimer);
        var userTypingObj = {
            uId: this.sessionUser.uid,
            conversationId: this.current_conversation_id,
            message: ""
        }
        socket.emit('user_typing', userTypingObj, function(result) {

        }); //sending data to server
    };

    Chat.prototype.delete = function() {
        var msgDeleteObj = {
            uId: User.me().uid,
            messageId: this.chatObject[this.chatObject.length - 1].messageId
        }

        $mdDialog.show({
            templateUrl: 'partials/sub-partials/deleteConfirm.tmpl',
            controller: function($scope, deleteObj) {
                $scope.title = "Do you want to delete this message?";
                $scope.ok = "Yes";
                $scope.cancel = function() {
                    $mdDialog.cancel();
                }
                $scope.confirm = function() {
                    socket.emit('messagedelete', deleteObj, function(result) {});
                    $mdDialog.cancel();
                }
            },
            locals: {
                deleteObj: msgDeleteObj
            }
        })
    }

    Chat.prototype.disconnect = function() {
        var disconnectObj = {
            uId: this.sessionUser.uid
        };
        //console.log(disconnectObj)
        socket.emit('customize_disconnect', disconnectObj, function(result) {});
    };

    Chat.prototype.login = function() {
            if (typeof User.getCredentials() != 'undefined') {
                socket.emit('login', {
                    uId: User.me().uid,
                    token: User.getCredentials().token
                }, function(result) {});
            }
            socket.on('receiveConnectedUserLoginStatus', function(data) {
                // console.log('on receiveConnectedUserLoginStatus',data)
                for (var i = 0; i < this.mainObj.user.length; i++) {
                    if (this.mainObj.user[i].user.uid == data.data.uid) {
                        this.mainObj.user[i].user = data.data;
                    }
                }
            }.bind(this))
        }
        //receive offline messages
    Chat.prototype.reload = function() {

        var defer = $q.defer();
        socket.on('receiveOfflineMessages', function(data) {
            this.mainObj.user = [];
            this.total_seen = 0;
            if (data.data.length != 0) {
                for (var i = 0; i < data.data.length; i++) {
                    if (data.data[i].chat.length != 0) {
                        this.mainObj.user.push({ key: data.data[i].chat[0].conversationId, user: data.data[i].user, me: User.me(), index: i, lastMessageId: data.data[i].chat[data.data[i].chat.length - 1].createdTime, isTyping: false })
                        this.mainObj.chatSpecific[data.data[i].chat[0].conversationId] = data.data[i].chat;
                        this.mainObj.chatSpecific[data.data[i].chat[0].conversationId].user = data.data[i].user;
                        this.total_seen = data.data[i].chat[data.data[i].chat.length - 1].seen == false ? this.total_seen + 1 : this.total_seen + 0;
                    }
                }

                if (typeof data.data[0].chat != "undefined") {
                    last_conversation_id = data.data[0].chat[0].conversationCreatedTime;
                }
                defer.resolve();
            } else {
                this.seo = {
                    title: 'Messages - Linkagoal'
                }
                defer.resolve({});
            }
        }.bind(this));

        return defer.promise;
    }
    return Chat;
})

.controller('MessagingConvoCtrl', ['$scope', '$rootScope', 'User', '$stateParams', '$q', 'SearchDataServices', 'socket', '$timeout', 'ngProgressFactory', 'GoalsDataServices', 'PageMetaData', '$location', function($scope, $rootScope, User, $stateParams, $q, SearchDataServices, socket, $timeout, ngProgressFactory, GoalsDataServices, PageMetaData, $location) {

    $scope.sessionUser = User.me();
    PageMetaData.setTitle('Messages')
    $scope.newUser = {}
    $scope.newUser.querySearch = function(text) {
        var def = $q.defer();
        var offset = 0;
        var limit = 5;
        GoalsDataServices.userConnections($scope.newUser.searchText, { offset: 0, limit: 5 })
            .success(function(result) {
                if (typeof result.data == "undefined") {
                    def.reject(result.data);
                } else {
                    def.resolve(result.data);
                }
            });
        return def.promise;
    }

    $scope.newUser.selectedItemChange = function(item) {
        if (typeof $scope.newUser.selectedItem != 'undefined' && $scope.newUser.selectedItem != null) {
            $scope.chatFactory.selectedItem = $scope.newUser.selectedItem.uid;
            socket.emit('search_conversation', { uId: $scope.sessionUser.uid, searchUserId: $scope.newUser.selectedItem.uid }, function(res) {})
        }

    }
    var changeRoute = function(url, forceReload) {
        $location.path(url);
    };

    $rootScope.chatFactory.onChat = true;
    //if ($rootScope.chatFactory.mainObj.chatSpecific)
    $scope.progressbar = ngProgressFactory.createInstance();
    $scope.progressbar.setColor('#12bcb5');
    if (typeof $rootScope.chatFactory.mainObj.chatSpecific[$stateParams.id] == "undefined") {
        $scope.progressbar.start();
        if ($stateParams.id != "") {
            $rootScope.chatFactory.reload().then(function(res) {
                if (typeof res != "undefined") {
                    $scope.progressbar.complete();
                    $rootScope.chatFactory.chat($stateParams.id, -1);
                } else {
                    $scope.progressbar.complete();
                    $rootScope.chatFactory.chat($stateParams.id, -1);
                    //changeRoute('/messages/conversation/');
                }
            })
        } else {
            $scope.progressbar.complete();
        }
    } else {
        $rootScope.chatFactory.chat($stateParams.id, -1);
    }


}])

.directive('whenscrolltop', function($rootScope) {
    return {
        restrict: "AE",
        scope: {
            scrolldisabled: '=scrolldisabled'
        },
        link: function(scope, element, attrs) {
            var threshold = 50;
            //.scrolldisabled = true;
            element.scroll(function() {
                if ((element.scrollTop() <= threshold) && scope.scrolldisabled == false) {
                    scope.scrolldisabled = $rootScope.chatFactory.status.loading = true
                    scope.$apply(attrs.whenscrolltop);
                    element.scrollTop(200)
                }
            });
        }
    };
});

Array.prototype.move = function(element, offset, id) {
    index = functiontofindIndexByKeyValue(element, 'key', id)
    newIndex = index + offset

    if (newIndex > -1 && newIndex < this.length) {

        removedElement = this.splice(index, 1)[0]
        this.unshift(removedElement);
    }
}

function functiontofindIndexByKeyValue(arraytosearch, key, valuetosearch) {

    for (var i = 0; i < arraytosearch.length; i++) {

        if (arraytosearch[i][key] == valuetosearch) {
            return i;
        }
    }
    return null;
}
;/**
 * Created by Mubeen on 4/5/2016.
 */
angular.module('app.findfriends', ['satellizer'])

.config(function($stateProvider, $urlRouterProvider, $authProvider, lagConfig) {

    $authProvider.google({
        url: lagConfig.apiUrl + 'auth/google/contacts',
        clientId: '167113267439-naku64je0j9co6f6q8juk8nurkbpts2p.apps.googleusercontent.com'
    });
    $authProvider.yahoo({
        url: lagConfig.apiUrl + 'auth/yahoo/contacts',
        clientId: 'dj0yJmk9UUFERDVKYW9NYnZQJmQ9WVdrOVFYVlhSa2cxTXpZbWNHbzlNQS0tJnM9Y29uc3VtZXJzZWNyZXQmeD1jOQ--'
    });
    $authProvider.live({
        url: lagConfig.apiUrl + 'auth/hotmail/contacts',
        clientId: '0000000044185936'
    });

    $stateProvider.state('app.findfriends-main', {
        url: '/find-friends',
        templateUrl: 'partials/findfriends.html',
        resolve: {
            loginRequired: function(User) {
                return User.loginRequired();
            }
        },
        page: 0
    })
})

.controller('FindFriendsParentCtrl', ['$scope', function($scope) {
    $scope.main
}])

.controller('FindFriendsCtrl', function($scope, $rootScope, PageMetaData, $state, $location, $auth, FindFriends) {
    $scope.stateIndex = 1;
    $scope.selected = [];
    $scope.items = [];

    $scope.toggle = function(item, list) {
        var idx = list.indexOf(item);
        if (idx > -1) {
            list.splice(idx, 1);
        } else {
            list.push(item);
        }
    };

    $scope.exists = function(item, list) {
        return list.indexOf(item) > -1;
    };

    $scope.isChecked = function() {
        return $scope.selected.length === $scope.items.length;
    };

    $scope.toggleAll = function() {
        if ($scope.selected.length === $scope.items.length) {
            $scope.selected = [];
        } else if ($scope.selected.length === 0 || $scope.selected.length > 0) {
            // angular.forEach($scope.items, function(i, k){
            //     if (i.isFollowing == 0) {
            //         $scope.selected.push(i.uid)
            //     }
            // });
            $scope.selected = $scope.items.slice(0);
        }
    };

    $scope.isIndeterminate = function() {
        return ($scope.selected.length !== 0 && $scope.selected.length !== $scope.items.length);
    };

    $scope.inviteEmailNow = function() {
        $scope.isLoadingBtn = true;
        var selectedIds = [];
        angular.forEach($scope.selected, function(contact, key) {
            selectedIds.push(contact.id);
        });

        FindFriends.invite(selectedIds).success(function(res) {
            setTimeout(function() {
                $scope.whoAreOnLinkagoal();
            }, 250)
            $scope.isLoadingBtn = false;
        })
    }

    $scope.followMutipleUsers = function() {
        $scope.isLoadingBtn = true;
        var selectedIds = [];
        angular.forEach($scope.selected, function(contact, key) {
            if (contact.isFollowing == 0)
            selectedIds.push(contact.uid);
        });

        if (selectedIds.length > 0) {
            FindFriends.followMultiple(selectedIds, 3).success(function(res) {
                $scope.isLoadingBtn = false;
                $location.url("/dashboard");
            })
        } else {
            $location.url("/dashboard");
        }
    }

    $scope.whoAreOnLinkagoal = function() {
        $scope.selected = [];
        $scope.items = $scope.users;
        $scope.toggleAll();
        setTimeout(function() {
            $scope.stateIndex = 3;
        }, 250);
    }

    $scope.isLoading = false;
    $rootScope.$on('satellizer:load', function(data) {
        $scope.isLoading = data;
    });

    $scope.authenticate = function(provider) {
        $auth.authenticate(provider).then(function(result) {

            FindFriends.getWhoAreNotOnLinkagoal(provider).success(function(res) {
                $scope.items = res.data;
                $scope.stateIndex = 2;
                $scope.isLoading = false;
            })
            setTimeout(function() {
                FindFriends.getWhoAreOnLinkagoal(provider).success(function(res) {
                    $scope.users = res.data;
                })
            }, 1000)
        }, function(err) {
            $scope.isLoading = false;
            console.log("err");
        });
    };
})

.controller('FindFriendsWhoAreOnLinkagoalCtrl', ['$scope', 'PageMetaData', function($scope, PageMetaData) {
    console.log('FindFriendsWhoAreOnLinkagoalCtrl Contacts');
}])
;LinkagoalWebApp.controller('NotificationsCtrl', ['$scope', 'NotificationDataServices', 'ngProgressFactory', function($scope, NotificationDataServices, ngProgressFactory) {
    $scope.pageLoaded = false;

    var limit = 50,
        offset = 0;

    NotificationDataServices.get({ offset: offset, limit: limit }).success(function(res) {
        $scope.notifications = res.data.notifications;
        $scope.notSeenCount = res.data.unseen;
        $scope.pageLoaded = true;
    })

    $scope.readNotification = function(id) {
        NotificationDataServices.read(id);
    }

    $scope.seo = {
        title: 'Notifications',
        description: 'settings/profile'
    }

}]);;angular.module('ui.bootstrap.position', [])

/**
 * A set of utility methods for working with the DOM.
 * It is meant to be used where we need to absolute-position elements in
 * relation to another element (this is the case for tooltips, popovers,
 * typeahead suggestions etc.).
 */
.factory('$uibPosition', ['$document', '$window', function($document, $window) {
    /**
     * Used by scrollbarWidth() function to cache scrollbar's width.
     * Do not access this variable directly, use scrollbarWidth() instead.
     */
    var SCROLLBAR_WIDTH;
    /**
     * scrollbar on body and html element in IE and Edge overlay
     * content and should be considered 0 width.
     */
    var BODY_SCROLLBAR_WIDTH;
    var OVERFLOW_REGEX = {
        normal: /(auto|scroll)/,
        hidden: /(auto|scroll|hidden)/
    };
    var PLACEMENT_REGEX = {
        auto: /\s?auto?\s?/i,
        primary: /^(top|bottom|left|right)$/,
        secondary: /^(top|bottom|left|right|center)$/,
        vertical: /^(top|bottom)$/
    };
    var BODY_REGEX = /(HTML|BODY)/;

    return {

        /**
         * Provides a raw DOM element from a jQuery/jQLite element.
         *
         * @param {element} elem - The element to convert.
         *
         * @returns {element} A HTML element.
         */
        getRawNode: function(elem) {
            return elem.nodeName ? elem : elem[0] || elem;
        },

        /**
         * Provides a parsed number for a style property.  Strips
         * units and casts invalid numbers to 0.
         *
         * @param {string} value - The style value to parse.
         *
         * @returns {number} A valid number.
         */
        parseStyle: function(value) {
            value = parseFloat(value);
            return isFinite(value) ? value : 0;
        },

        /**
         * Provides the closest positioned ancestor.
         *
         * @param {element} element - The element to get the offest parent for.
         *
         * @returns {element} The closest positioned ancestor.
         */
        offsetParent: function(elem) {
            elem = this.getRawNode(elem);

            var offsetParent = elem.offsetParent || $document[0].documentElement;

            function isStaticPositioned(el) {
                return ($window.getComputedStyle(el).position || 'static') === 'static';
            }

            while (offsetParent && offsetParent !== $document[0].documentElement && isStaticPositioned(offsetParent)) {
                offsetParent = offsetParent.offsetParent;
            }

            return offsetParent || $document[0].documentElement;
        },

        /**
         * Provides the scrollbar width, concept from TWBS measureScrollbar()
         * function in https://github.com/twbs/bootstrap/blob/master/js/modal.js
         * In IE and Edge, scollbar on body and html element overlay and should
         * return a width of 0.
         *
         * @returns {number} The width of the browser scollbar.
         */
        scrollbarWidth: function(isBody) {
            if (isBody) {
                if (angular.isUndefined(BODY_SCROLLBAR_WIDTH)) {
                    var bodyElem = $document.find('body');
                    bodyElem.addClass('uib-position-body-scrollbar-measure');
                    BODY_SCROLLBAR_WIDTH = $window.innerWidth - bodyElem[0].clientWidth;
                    BODY_SCROLLBAR_WIDTH = isFinite(BODY_SCROLLBAR_WIDTH) ? BODY_SCROLLBAR_WIDTH : 0;
                    bodyElem.removeClass('uib-position-body-scrollbar-measure');
                }
                return BODY_SCROLLBAR_WIDTH;
            }

            if (angular.isUndefined(SCROLLBAR_WIDTH)) {
                var scrollElem = angular.element('<div class="uib-position-scrollbar-measure"></div>');
                $document.find('body').append(scrollElem);
                SCROLLBAR_WIDTH = scrollElem[0].offsetWidth - scrollElem[0].clientWidth;
                SCROLLBAR_WIDTH = isFinite(SCROLLBAR_WIDTH) ? SCROLLBAR_WIDTH : 0;
                scrollElem.remove();
            }

            return SCROLLBAR_WIDTH;
        },

        /**
         * Provides the padding required on an element to replace the scrollbar.
         *
         * @returns {object} An object with the following properties:
         *   <ul>
         *     <li>**scrollbarWidth**: the width of the scrollbar</li>
         *     <li>**widthOverflow**: whether the the width is overflowing</li>
         *     <li>**right**: the amount of right padding on the element needed to replace the scrollbar</li>
         *     <li>**rightOriginal**: the amount of right padding currently on the element</li>
         *     <li>**heightOverflow**: whether the the height is overflowing</li>
         *     <li>**bottom**: the amount of bottom padding on the element needed to replace the scrollbar</li>
         *     <li>**bottomOriginal**: the amount of bottom padding currently on the element</li>
         *   </ul>
         */
        scrollbarPadding: function(elem) {
            elem = this.getRawNode(elem);

            var elemStyle = $window.getComputedStyle(elem);
            var paddingRight = this.parseStyle(elemStyle.paddingRight);
            var paddingBottom = this.parseStyle(elemStyle.paddingBottom);
            var scrollParent = this.scrollParent(elem, false, true);
            var scrollbarWidth = this.scrollbarWidth(scrollParent, BODY_REGEX.test(scrollParent.tagName));

            return {
                scrollbarWidth: scrollbarWidth,
                widthOverflow: scrollParent.scrollWidth > scrollParent.clientWidth,
                right: paddingRight + scrollbarWidth,
                originalRight: paddingRight,
                heightOverflow: scrollParent.scrollHeight > scrollParent.clientHeight,
                bottom: paddingBottom + scrollbarWidth,
                originalBottom: paddingBottom
            };
        },

        /**
         * Checks to see if the element is scrollable.
         *
         * @param {element} elem - The element to check.
         * @param {boolean=} [includeHidden=false] - Should scroll style of 'hidden' be considered,
         *   default is false.
         *
         * @returns {boolean} Whether the element is scrollable.
         */
        isScrollable: function(elem, includeHidden) {
            elem = this.getRawNode(elem);

            var overflowRegex = includeHidden ? OVERFLOW_REGEX.hidden : OVERFLOW_REGEX.normal;
            var elemStyle = $window.getComputedStyle(elem);
            return overflowRegex.test(elemStyle.overflow + elemStyle.overflowY + elemStyle.overflowX);
        },

        /**
         * Provides the closest scrollable ancestor.
         * A port of the jQuery UI scrollParent method:
         * https://github.com/jquery/jquery-ui/blob/master/ui/scroll-parent.js
         *
         * @param {element} elem - The element to find the scroll parent of.
         * @param {boolean=} [includeHidden=false] - Should scroll style of 'hidden' be considered,
         *   default is false.
         * @param {boolean=} [includeSelf=false] - Should the element being passed be
         * included in the scrollable llokup.
         *
         * @returns {element} A HTML element.
         */
        scrollParent: function(elem, includeHidden, includeSelf) {
            elem = this.getRawNode(elem);

            var overflowRegex = includeHidden ? OVERFLOW_REGEX.hidden : OVERFLOW_REGEX.normal;
            var documentEl = $document[0].documentElement;
            var elemStyle = $window.getComputedStyle(elem);
            if (includeSelf && overflowRegex.test(elemStyle.overflow + elemStyle.overflowY + elemStyle.overflowX)) {
                return elem;
            }
            var excludeStatic = elemStyle.position === 'absolute';
            var scrollParent = elem.parentElement || documentEl;

            if (scrollParent === documentEl || elemStyle.position === 'fixed') {
                return documentEl;
            }

            while (scrollParent.parentElement && scrollParent !== documentEl) {
                var spStyle = $window.getComputedStyle(scrollParent);
                if (excludeStatic && spStyle.position !== 'static') {
                    excludeStatic = false;
                }

                if (!excludeStatic && overflowRegex.test(spStyle.overflow + spStyle.overflowY + spStyle.overflowX)) {
                    break;
                }
                scrollParent = scrollParent.parentElement;
            }

            return scrollParent;
        },

        /**
         * Provides read-only equivalent of jQuery's position function:
         * http://api.jquery.com/position/ - distance to closest positioned
         * ancestor.  Does not account for margins by default like jQuery position.
         *
         * @param {element} elem - The element to caclulate the position on.
         * @param {boolean=} [includeMargins=false] - Should margins be accounted
         * for, default is false.
         *
         * @returns {object} An object with the following properties:
         *   <ul>
         *     <li>**width**: the width of the element</li>
         *     <li>**height**: the height of the element</li>
         *     <li>**top**: distance to top edge of offset parent</li>
         *     <li>**left**: distance to left edge of offset parent</li>
         *   </ul>
         */
        position: function(elem, includeMagins) {
            elem = this.getRawNode(elem);

            var elemOffset = this.offset(elem);
            if (includeMagins) {
                var elemStyle = $window.getComputedStyle(elem);
                elemOffset.top -= this.parseStyle(elemStyle.marginTop);
                elemOffset.left -= this.parseStyle(elemStyle.marginLeft);
            }
            var parent = this.offsetParent(elem);
            var parentOffset = { top: 0, left: 0 };

            if (parent !== $document[0].documentElement) {
                parentOffset = this.offset(parent);
                parentOffset.top += parent.clientTop - parent.scrollTop;
                parentOffset.left += parent.clientLeft - parent.scrollLeft;
            }

            return {
                width: Math.round(angular.isNumber(elemOffset.width) ? elemOffset.width : elem.offsetWidth),
                height: Math.round(angular.isNumber(elemOffset.height) ? elemOffset.height : elem.offsetHeight),
                top: Math.round(elemOffset.top - parentOffset.top),
                left: Math.round(elemOffset.left - parentOffset.left)
            };
        },

        /**
         * Provides read-only equivalent of jQuery's offset function:
         * http://api.jquery.com/offset/ - distance to viewport.  Does
         * not account for borders, margins, or padding on the body
         * element.
         *
         * @param {element} elem - The element to calculate the offset on.
         *
         * @returns {object} An object with the following properties:
         *   <ul>
         *     <li>**width**: the width of the element</li>
         *     <li>**height**: the height of the element</li>
         *     <li>**top**: distance to top edge of viewport</li>
         *     <li>**right**: distance to bottom edge of viewport</li>
         *   </ul>
         */
        offset: function(elem) {
            elem = this.getRawNode(elem);

            var elemBCR = elem.getBoundingClientRect();
            return {
                width: Math.round(angular.isNumber(elemBCR.width) ? elemBCR.width : elem.offsetWidth),
                height: Math.round(angular.isNumber(elemBCR.height) ? elemBCR.height : elem.offsetHeight),
                top: Math.round(elemBCR.top + ($window.pageYOffset || $document[0].documentElement.scrollTop)),
                left: Math.round(elemBCR.left + ($window.pageXOffset || $document[0].documentElement.scrollLeft))
            };
        },

        /**
         * Provides offset distance to the closest scrollable ancestor
         * or viewport.  Accounts for border and scrollbar width.
         *
         * Right and bottom dimensions represent the distance to the
         * respective edge of the viewport element.  If the element
         * edge extends beyond the viewport, a negative value will be
         * reported.
         *
         * @param {element} elem - The element to get the viewport offset for.
         * @param {boolean=} [useDocument=false] - Should the viewport be the document element instead
         * of the first scrollable element, default is false.
         * @param {boolean=} [includePadding=true] - Should the padding on the offset parent element
         * be accounted for, default is true.
         *
         * @returns {object} An object with the following properties:
         *   <ul>
         *     <li>**top**: distance to the top content edge of viewport element</li>
         *     <li>**bottom**: distance to the bottom content edge of viewport element</li>
         *     <li>**left**: distance to the left content edge of viewport element</li>
         *     <li>**right**: distance to the right content edge of viewport element</li>
         *   </ul>
         */
        viewportOffset: function(elem, useDocument, includePadding) {
            elem = this.getRawNode(elem);
            includePadding = includePadding !== false ? true : false;

            var elemBCR = elem.getBoundingClientRect();
            var offsetBCR = { top: 0, left: 0, bottom: 0, right: 0 };

            var offsetParent = useDocument ? $document[0].documentElement : this.scrollParent(elem);
            var offsetParentBCR = offsetParent.getBoundingClientRect();

            offsetBCR.top = offsetParentBCR.top + offsetParent.clientTop;
            offsetBCR.left = offsetParentBCR.left + offsetParent.clientLeft;
            if (offsetParent === $document[0].documentElement) {
                offsetBCR.top += $window.pageYOffset;
                offsetBCR.left += $window.pageXOffset;
            }
            offsetBCR.bottom = offsetBCR.top + offsetParent.clientHeight;
            offsetBCR.right = offsetBCR.left + offsetParent.clientWidth;

            if (includePadding) {
                var offsetParentStyle = $window.getComputedStyle(offsetParent);
                offsetBCR.top += this.parseStyle(offsetParentStyle.paddingTop);
                offsetBCR.bottom -= this.parseStyle(offsetParentStyle.paddingBottom);
                offsetBCR.left += this.parseStyle(offsetParentStyle.paddingLeft);
                offsetBCR.right -= this.parseStyle(offsetParentStyle.paddingRight);
            }

            return {
                top: Math.round(elemBCR.top - offsetBCR.top),
                bottom: Math.round(offsetBCR.bottom - elemBCR.bottom),
                left: Math.round(elemBCR.left - offsetBCR.left),
                right: Math.round(offsetBCR.right - elemBCR.right)
            };
        },

        /**
         * Provides an array of placement values parsed from a placement string.
         * Along with the 'auto' indicator, supported placement strings are:
         *   <ul>
         *     <li>top: element on top, horizontally centered on host element.</li>
         *     <li>top-left: element on top, left edge aligned with host element left edge.</li>
         *     <li>top-right: element on top, lerightft edge aligned with host element right edge.</li>
         *     <li>bottom: element on bottom, horizontally centered on host element.</li>
         *     <li>bottom-left: element on bottom, left edge aligned with host element left edge.</li>
         *     <li>bottom-right: element on bottom, right edge aligned with host element right edge.</li>
         *     <li>left: element on left, vertically centered on host element.</li>
         *     <li>left-top: element on left, top edge aligned with host element top edge.</li>
         *     <li>left-bottom: element on left, bottom edge aligned with host element bottom edge.</li>
         *     <li>right: element on right, vertically centered on host element.</li>
         *     <li>right-top: element on right, top edge aligned with host element top edge.</li>
         *     <li>right-bottom: element on right, bottom edge aligned with host element bottom edge.</li>
         *   </ul>
         * A placement string with an 'auto' indicator is expected to be
         * space separated from the placement, i.e: 'auto bottom-left'  If
         * the primary and secondary placement values do not match 'top,
         * bottom, left, right' then 'top' will be the primary placement and
         * 'center' will be the secondary placement.  If 'auto' is passed, true
         * will be returned as the 3rd value of the array.
         *
         * @param {string} placement - The placement string to parse.
         *
         * @returns {array} An array with the following values
         * <ul>
         *   <li>**[0]**: The primary placement.</li>
         *   <li>**[1]**: The secondary placement.</li>
         *   <li>**[2]**: If auto is passed: true, else undefined.</li>
         * </ul>
         */
        parsePlacement: function(placement) {
            var autoPlace = PLACEMENT_REGEX.auto.test(placement);
            if (autoPlace) {
                placement = placement.replace(PLACEMENT_REGEX.auto, '');
            }

            placement = placement.split('-');

            placement[0] = placement[0] || 'top';
            if (!PLACEMENT_REGEX.primary.test(placement[0])) {
                placement[0] = 'top';
            }

            placement[1] = placement[1] || 'center';
            if (!PLACEMENT_REGEX.secondary.test(placement[1])) {
                placement[1] = 'center';
            }

            if (autoPlace) {
                placement[2] = true;
            } else {
                placement[2] = false;
            }

            return placement;
        },

        /**
         * Provides coordinates for an element to be positioned relative to
         * another element.  Passing 'auto' as part of the placement parameter
         * will enable smart placement - where the element fits. i.e:
         * 'auto left-top' will check to see if there is enough space to the left
         * of the hostElem to fit the targetElem, if not place right (same for secondary
         * top placement).  Available space is calculated using the viewportOffset
         * function.
         *
         * @param {element} hostElem - The element to position against.
         * @param {element} targetElem - The element to position.
         * @param {string=} [placement=top] - The placement for the targetElem,
         *   default is 'top'. 'center' is assumed as secondary placement for
         *   'top', 'left', 'right', and 'bottom' placements.  Available placements are:
         *   <ul>
         *     <li>top</li>
         *     <li>top-right</li>
         *     <li>top-left</li>
         *     <li>bottom</li>
         *     <li>bottom-left</li>
         *     <li>bottom-right</li>
         *     <li>left</li>
         *     <li>left-top</li>
         *     <li>left-bottom</li>
         *     <li>right</li>
         *     <li>right-top</li>
         *     <li>right-bottom</li>
         *   </ul>
         * @param {boolean=} [appendToBody=false] - Should the top and left values returned
         *   be calculated from the body element, default is false.
         *
         * @returns {object} An object with the following properties:
         *   <ul>
         *     <li>**top**: Value for targetElem top.</li>
         *     <li>**left**: Value for targetElem left.</li>
         *     <li>**placement**: The resolved placement.</li>
         *   </ul>
         */
        positionElements: function(hostElem, targetElem, placement, appendToBody) {
            hostElem = this.getRawNode(hostElem);
            targetElem = this.getRawNode(targetElem);

            // need to read from prop to support tests.
            var targetWidth = angular.isDefined(targetElem.offsetWidth) ? targetElem.offsetWidth : targetElem.prop('offsetWidth');
            var targetHeight = angular.isDefined(targetElem.offsetHeight) ? targetElem.offsetHeight : targetElem.prop('offsetHeight');

            placement = this.parsePlacement(placement);

            var hostElemPos = appendToBody ? this.offset(hostElem) : this.position(hostElem);
            var targetElemPos = { top: 0, left: 0, placement: '' };

            if (placement[2]) {
                var viewportOffset = this.viewportOffset(hostElem, appendToBody);

                var targetElemStyle = $window.getComputedStyle(targetElem);
                var adjustedSize = {
                    width: targetWidth + Math.round(Math.abs(this.parseStyle(targetElemStyle.marginLeft) + this.parseStyle(targetElemStyle.marginRight))),
                    height: targetHeight + Math.round(Math.abs(this.parseStyle(targetElemStyle.marginTop) + this.parseStyle(targetElemStyle.marginBottom)))
                };

                placement[0] = placement[0] === 'top' && adjustedSize.height > viewportOffset.top && adjustedSize.height <= viewportOffset.bottom ? 'bottom' :
                    placement[0] === 'bottom' && adjustedSize.height > viewportOffset.bottom && adjustedSize.height <= viewportOffset.top ? 'top' :
                    placement[0] === 'left' && adjustedSize.width > viewportOffset.left && adjustedSize.width <= viewportOffset.right ? 'right' :
                    placement[0] === 'right' && adjustedSize.width > viewportOffset.right && adjustedSize.width <= viewportOffset.left ? 'left' :
                    placement[0];

                placement[1] = placement[1] === 'top' && adjustedSize.height - hostElemPos.height > viewportOffset.bottom && adjustedSize.height - hostElemPos.height <= viewportOffset.top ? 'bottom' :
                    placement[1] === 'bottom' && adjustedSize.height - hostElemPos.height > viewportOffset.top && adjustedSize.height - hostElemPos.height <= viewportOffset.bottom ? 'top' :
                    placement[1] === 'left' && adjustedSize.width - hostElemPos.width > viewportOffset.right && adjustedSize.width - hostElemPos.width <= viewportOffset.left ? 'right' :
                    placement[1] === 'right' && adjustedSize.width - hostElemPos.width > viewportOffset.left && adjustedSize.width - hostElemPos.width <= viewportOffset.right ? 'left' :
                    placement[1];

                if (placement[1] === 'center') {
                    if (PLACEMENT_REGEX.vertical.test(placement[0])) {
                        var xOverflow = hostElemPos.width / 2 - targetWidth / 2;
                        if (viewportOffset.left + xOverflow < 0 && adjustedSize.width - hostElemPos.width <= viewportOffset.right) {
                            placement[1] = 'left';
                        } else if (viewportOffset.right + xOverflow < 0 && adjustedSize.width - hostElemPos.width <= viewportOffset.left) {
                            placement[1] = 'right';
                        }
                    } else {
                        var yOverflow = hostElemPos.height / 2 - adjustedSize.height / 2;
                        if (viewportOffset.top + yOverflow < 0 && adjustedSize.height - hostElemPos.height <= viewportOffset.bottom) {
                            placement[1] = 'top';
                        } else if (viewportOffset.bottom + yOverflow < 0 && adjustedSize.height - hostElemPos.height <= viewportOffset.top) {
                            placement[1] = 'bottom';
                        }
                    }
                }
            }

            switch (placement[0]) {
                case 'top':
                    targetElemPos.top = hostElemPos.top - targetHeight;
                    break;
                case 'bottom':
                    targetElemPos.top = hostElemPos.top + hostElemPos.height;
                    break;
                case 'left':
                    targetElemPos.left = hostElemPos.left - targetWidth;
                    break;
                case 'right':
                    targetElemPos.left = hostElemPos.left + hostElemPos.width;
                    break;
            }

            switch (placement[1]) {
                case 'top':
                    targetElemPos.top = hostElemPos.top;
                    break;
                case 'bottom':
                    targetElemPos.top = hostElemPos.top + hostElemPos.height - targetHeight;
                    break;
                case 'left':
                    targetElemPos.left = hostElemPos.left;
                    break;
                case 'right':
                    targetElemPos.left = hostElemPos.left + hostElemPos.width - targetWidth;
                    break;
                case 'center':
                    if (PLACEMENT_REGEX.vertical.test(placement[0])) {
                        targetElemPos.left = hostElemPos.left + hostElemPos.width / 2 - targetWidth / 2;
                    } else {
                        targetElemPos.top = hostElemPos.top + hostElemPos.height / 2 - targetHeight / 2;
                    }
                    break;
            }

            targetElemPos.top = Math.round(targetElemPos.top);
            targetElemPos.left = Math.round(targetElemPos.left);
            targetElemPos.placement = placement[1] === 'center' ? placement[0] : placement[0] + '-' + placement[1];

            return targetElemPos;
        },

        /**
         * Provides a way for positioning tooltip & dropdown
         * arrows when using placement options beyond the standard
         * left, right, top, or bottom.
         *
         * @param {element} elem - The tooltip/dropdown element.
         * @param {string} placement - The placement for the elem.
         */
        positionArrow: function(elem, placement) {
            elem = this.getRawNode(elem);

            var innerElem = elem.querySelector('.tooltip-inner, .popover-inner');
            if (!innerElem) {
                return;
            }

            var isTooltip = angular.element(innerElem).hasClass('tooltip-inner');

            var arrowElem = isTooltip ? elem.querySelector('.tooltip-arrow') : elem.querySelector('.arrow');
            if (!arrowElem) {
                return;
            }

            var arrowCss = {
                top: '',
                bottom: '',
                left: '',
                right: ''
            };

            placement = this.parsePlacement(placement);
            if (placement[1] === 'center') {
                // no adjustment necessary - just reset styles
                angular.element(arrowElem).css(arrowCss);
                return;
            }

            var borderProp = 'border-' + placement[0] + '-width';
            var borderWidth = $window.getComputedStyle(arrowElem)[borderProp];

            var borderRadiusProp = 'border-';
            if (PLACEMENT_REGEX.vertical.test(placement[0])) {
                borderRadiusProp += placement[0] + '-' + placement[1];
            } else {
                borderRadiusProp += placement[1] + '-' + placement[0];
            }
            borderRadiusProp += '-radius';
            var borderRadius = $window.getComputedStyle(isTooltip ? innerElem : elem)[borderRadiusProp];

            switch (placement[0]) {
                case 'top':
                    arrowCss.bottom = isTooltip ? '0' : '-' + borderWidth;
                    break;
                case 'bottom':
                    arrowCss.top = isTooltip ? '0' : '-' + borderWidth;
                    break;
                case 'left':
                    arrowCss.right = isTooltip ? '0' : '-' + borderWidth;
                    break;
                case 'right':
                    arrowCss.left = isTooltip ? '0' : '-' + borderWidth;
                    break;
            }

            arrowCss[placement[1]] = borderRadius;

            angular.element(arrowElem).css(arrowCss);
        }
    };
}]);


angular.module('ui.bootstrap.dropdown', ['ui.bootstrap.position'])

.constant('uibDropdownConfig', {
    appendToOpenClass: 'uib-dropdown-open',
    openClass: 'open'
})

.service('uibDropdownService', ['$document', '$rootScope', function($document, $rootScope) {
    var openScope = null;

    this.open = function(dropdownScope) {
        if (!openScope) {
            $document.on('click', closeDropdown);
            $document.on('keydown', keybindFilter);
        }

        if (openScope && openScope !== dropdownScope) {
            openScope.isOpen = false;
        }

        openScope = dropdownScope;
    };

    this.close = function(dropdownScope) {
        if (openScope === dropdownScope) {
            openScope = null;
            $document.off('click', closeDropdown);
            $document.off('keydown', keybindFilter);
        }
    };

    var closeDropdown = function(evt) {
        // This method may still be called during the same mouse event that
        // unbound this event handler. So check openScope before proceeding.
        if (!openScope) {
            return;
        }

        if (evt && openScope.getAutoClose() === 'disabled') {
            return;
        }

        if (evt && evt.which === 3) {
            return;
        }

        var toggleElement = openScope.getToggleElement();
        if (evt && toggleElement && toggleElement[0].contains(evt.target)) {
            return;
        }

        var dropdownElement = openScope.getDropdownElement();
        if (evt && openScope.getAutoClose() === 'outsideClick' &&
            dropdownElement && dropdownElement[0].contains(evt.target)) {
            return;
        }

        openScope.isOpen = false;

        if (!$rootScope.$$phase) {
            openScope.$apply();
        }
    };

    var keybindFilter = function(evt) {
        if (evt.which === 27) {
            openScope.focusToggleElement();
            closeDropdown();
        } else if (openScope.isKeynavEnabled() && [38, 40].indexOf(evt.which) !== -1 && openScope.isOpen) {
            evt.preventDefault();
            evt.stopPropagation();
            openScope.focusDropdownEntry(evt.which);
        }
    };
}])

.controller('UibDropdownController', ['$scope', '$element', '$attrs', '$parse', 'uibDropdownConfig', 'uibDropdownService', '$animate', '$uibPosition', '$document', '$compile', '$templateRequest', function($scope, $element, $attrs, $parse, dropdownConfig, uibDropdownService, $animate, $position, $document, $compile, $templateRequest) {
    var self = this,
        scope = $scope.$new(), // create a child scope so we are not polluting original one
        templateScope,
        appendToOpenClass = dropdownConfig.appendToOpenClass,
        openClass = dropdownConfig.openClass,
        getIsOpen,
        setIsOpen = angular.noop,
        toggleInvoker = $attrs.onToggle ? $parse($attrs.onToggle) : angular.noop,
        appendToBody = false,
        appendTo = null,
        keynavEnabled = false,
        selectedOption = null,
        body = $document.find('body');

    $element.addClass('dropdown');

    this.init = function() {
        if ($attrs.isOpen) {
            getIsOpen = $parse($attrs.isOpen);
            setIsOpen = getIsOpen.assign;

            $scope.$watch(getIsOpen, function(value) {
                scope.isOpen = !!value;
            });
        }

        if (angular.isDefined($attrs.dropdownAppendTo)) {
            var appendToEl = $parse($attrs.dropdownAppendTo)(scope);
            if (appendToEl) {
                appendTo = angular.element(appendToEl);
            }
        }

        appendToBody = angular.isDefined($attrs.dropdownAppendToBody);
        keynavEnabled = angular.isDefined($attrs.keyboardNav);

        if (appendToBody && !appendTo) {
            appendTo = body;
        }

        if (appendTo && self.dropdownMenu) {
            appendTo.append(self.dropdownMenu);
            $element.on('$destroy', function handleDestroyEvent() {
                self.dropdownMenu.remove();
            });
        }
    };

    this.toggle = function(open) {
        scope.isOpen = arguments.length ? !!open : !scope.isOpen;
        if (angular.isFunction(setIsOpen)) {
            setIsOpen(scope, scope.isOpen);
        }

        return scope.isOpen;
    };

    // Allow other directives to watch status
    this.isOpen = function() {
        return scope.isOpen;
    };

    scope.getToggleElement = function() {
        return self.toggleElement;
    };

    scope.getAutoClose = function() {
        return $attrs.autoClose || 'always'; //or 'outsideClick' or 'disabled'
    };

    scope.getElement = function() {
        return $element;
    };

    scope.isKeynavEnabled = function() {
        return keynavEnabled;
    };

    scope.focusDropdownEntry = function(keyCode) {
        var elems = self.dropdownMenu ? //If append to body is used.
            angular.element(self.dropdownMenu).find('a') :
            $element.find('ul').eq(0).find('a');

        switch (keyCode) {
            case 40:
                {
                    if (!angular.isNumber(self.selectedOption)) {
                        self.selectedOption = 0;
                    } else {
                        self.selectedOption = self.selectedOption === elems.length - 1 ?
                            self.selectedOption :
                            self.selectedOption + 1;
                    }
                    break;
                }
            case 38:
                {
                    if (!angular.isNumber(self.selectedOption)) {
                        self.selectedOption = elems.length - 1;
                    } else {
                        self.selectedOption = self.selectedOption === 0 ?
                            0 : self.selectedOption - 1;
                    }
                    break;
                }
        }
        elems[self.selectedOption].focus();
    };

    scope.getDropdownElement = function() {
        return self.dropdownMenu;
    };

    scope.focusToggleElement = function() {
        if (self.toggleElement) {
            self.toggleElement[0].focus();
        }
    };

    scope.$watch('isOpen', function(isOpen, wasOpen) {
        if (appendTo && self.dropdownMenu) {
            var pos = $position.positionElements($element, self.dropdownMenu, 'bottom-left', true),
                css,
                rightalign;

            css = {
                top: pos.top + 'px',
                display: isOpen ? 'block' : 'none'
            };

            rightalign = self.dropdownMenu.hasClass('dropdown-menu-right');
            if (!rightalign) {
                css.left = pos.left + 'px';
                css.right = 'auto';
            } else {
                css.left = 'auto';
                css.right = window.innerWidth -
                    (pos.left + $element.prop('offsetWidth')) + 'px';
            }

            // Need to adjust our positioning to be relative to the appendTo container
            // if it's not the body element
            if (!appendToBody) {
                var appendOffset = $position.offset(appendTo);

                css.top = pos.top - appendOffset.top + 'px';

                if (!rightalign) {
                    css.left = pos.left - appendOffset.left + 'px';
                } else {
                    css.right = window.innerWidth -
                        (pos.left - appendOffset.left + $element.prop('offsetWidth')) + 'px';
                }
            }

            self.dropdownMenu.css(css);
        }

        var openContainer = appendTo ? appendTo : $element;
        var hasOpenClass = openContainer.hasClass(appendTo ? appendToOpenClass : openClass);

        if (hasOpenClass === !isOpen) {
            $animate[isOpen ? 'addClass' : 'removeClass'](openContainer, appendTo ? appendToOpenClass : openClass).then(function() {
                if (angular.isDefined(isOpen) && isOpen !== wasOpen) {
                    toggleInvoker($scope, { open: !!isOpen });
                }
            });
        }

        if (isOpen) {
            if (self.dropdownMenuTemplateUrl) {
                $templateRequest(self.dropdownMenuTemplateUrl).then(function(tplContent) {
                    templateScope = scope.$new();
                    $compile(tplContent.trim())(templateScope, function(dropdownElement) {
                        var newEl = dropdownElement;
                        self.dropdownMenu.replaceWith(newEl);
                        self.dropdownMenu = newEl;
                    });
                });
            }

            scope.focusToggleElement();
            uibDropdownService.open(scope);
        } else {
            if (self.dropdownMenuTemplateUrl) {
                if (templateScope) {
                    templateScope.$destroy();
                }
                var newEl = angular.element('<ul class="dropdown-menu"></ul>');
                self.dropdownMenu.replaceWith(newEl);
                self.dropdownMenu = newEl;
            }

            uibDropdownService.close(scope);
            self.selectedOption = null;
        }

        if (angular.isFunction(setIsOpen)) {
            setIsOpen($scope, isOpen);
        }
    });
}])

.directive('uibDropdown', function() {
    return {
        controller: 'UibDropdownController',
        link: function(scope, element, attrs, dropdownCtrl) {
            dropdownCtrl.init();
        }
    };
})

.directive('uibDropdownMenu', function() {
    return {
        restrict: 'A',
        require: '?^uibDropdown',
        link: function(scope, element, attrs, dropdownCtrl) {
            if (!dropdownCtrl || angular.isDefined(attrs.dropdownNested)) {
                return;
            }

            element.addClass('dropdown-menu');

            var tplUrl = attrs.templateUrl;
            if (tplUrl) {
                dropdownCtrl.dropdownMenuTemplateUrl = tplUrl;
            }

            if (!dropdownCtrl.dropdownMenu) {
                dropdownCtrl.dropdownMenu = element;
            }
        }
    };
})

.directive('uibDropdownToggle', function() {
    return {
        require: '?^uibDropdown',
        link: function(scope, element, attrs, dropdownCtrl) {
            if (!dropdownCtrl) {
                return;
            }

            element.addClass('dropdown-toggle');

            dropdownCtrl.toggleElement = element;

            var toggleDropdown = function(event) {
                event.preventDefault();

                if (!element.hasClass('disabled') && !attrs.disabled) {
                    scope.$apply(function() {
                        dropdownCtrl.toggle();
                    });
                }
            };

            element.bind('click', toggleDropdown);

            // WAI-ARIA
            element.attr({ 'aria-haspopup': true, 'aria-expanded': false });
            scope.$watch(dropdownCtrl.isOpen, function(isOpen) {
                element.attr('aria-expanded', !!isOpen);
            });

            scope.$on('$destroy', function() {
                element.unbind('click', toggleDropdown);
            });
        }
    };
});
;LinkagoalWebApp.controller('ProfileCtrl', ['$scope', '$state', '$rootScope', '$stateParams', '$location', 'Profile', 'User', 'UserDataServices', 'ngProgressFactory', function($scope, $state, $rootScope, $stateParams, $location, Profile, User, UserDataServices, ngProgressFactory) {


    $scope.selectedIndex = $state.current.data.selected;
    $scope.$watch('selectedIndex', function(current, old) {
        switch (current) {
            case 0:
                $location.url("/" + Profile.data.username);
                break;
            case 1:
                $location.url("/" + Profile.data.username + "/goals");
                $scope.seo = {
                    title: 'The latest Goals from ' + Profile.data.name + ' ' + Profile.data.username + '.',
                    description: 'View ' + Profile.data.username + '\'s goal(s) on linkagoal, see what ' + Profile.data.username + ' has achieved / trying to accomplish.',
                    image: Profile.data.profile.medium
                }
                break;
            case 2:
                $location.url("/" + Profile.data.username + "/posts");
                $scope.seo = {
                    title: 'The latest Posts from ' + Profile.data.name + ' ' + Profile.data.username + '.',
                    description: 'View '+Profile.data.username+'\'s post(s) on linkagoal, check latest posts from '+Profile.data.username+' on goal based social network.',
                    image: Profile.data.profile.medium
                }
                break;
        }
    });
    //PageMetaData.setTitle(Profile.data.name);
    $scope.notfound = false;

    var offset = 0,
        limit = 5;


    $scope.getUserActivities = function() {
        if ($scope.isMainLoading) return;
        $scope.isMainLoading = true;
        $scope.noMoreFeedContent = true;

        UserDataServices.getUserPosts($scope.profile.uid, { filter: $scope.filter, offset: offset, limit: limit }).success(function(result) {
            $scope.activities = $scope.activities.concat(result.data);

            $scope.isMainLoading = false;
            if (result.data.length < limit) {
                $scope.noMoreFeedContent = true
            } else {
                setTimeout(function() {
                    $scope.noMoreFeedContent = false
                }, 1000)
            }
            offset = offset + limit;
        });
    }

    $scope.loadUserGoals = function() {
        if ($scope.noMoreFeedContent) return;
        $scope.isMainLoading = true;
        $scope.noMoreFeedContent = true;

        UserDataServices.getUserGoals(Profile.data.uid, { offset: offset, limit: limit }).success(function(result) {
            $scope.goals = $scope.goals.concat(result.data.goals);

            $scope.isMainLoading = false;
            if (result.data.goals.length < limit) {
                $scope.noMoreFeedContent = true
            } else {
                setTimeout(function() {
                    $scope.noMoreFeedContent = false
                }, 1000)
            }
            offset = offset + limit;
        });
    }
    if (Profile.meta.status == 404 || Profile.meta.status == 401 || Profile.meta.status == 500) {
        console.log("sdsd")
        $scope.notfound = true;
    } else {
        $scope.profile = Profile.data

        if ($scope.profile.isProtected == 0) {

            $scope.isMainLoading = false;
            if ($scope.selectedIndex == 0) {
                $scope.filter = "interactions";
            }

            if ($scope.selectedIndex == 1) {
                $scope.isMainLoading = true;
                $scope.goals = []
            }

            if ($scope.selectedIndex == 2) {
                $scope.filter = "post";
            }
        }
    }

    $scope.activities = [];

    $scope.$on('event.delete.post', function(ev, args) {
        $scope.activities.splice(args.index, 1);
    })

}]);


LinkagoalWebApp.controller('ProfileMainCtrl', ['$scope', '$rootScope', 'Profile', 'UserDataServices', 'User', function($scope, $rootScope, Profile, UserDataServices, User) {
    $scope.profile = Profile.data;

    if (Profile == false) {
        $scope.notfound = true;
        return false;
    }

    UserDataServices.Work.getAll(Profile.data.uid).success(function(res) {
        $scope.workInfo = res.data;
    })

    UserDataServices.Education.getAll(Profile.data.uid).success(function(res) {
        $scope.userEduInfo = res.data;
    });

    UserDataServices.getUserInterests(Profile.data.uid).success(function(result) {
        $scope.interests = result.data;
    });

    UserDataServices.connections(Profile.data.uid).success(function(result) {
        $scope.connections = result.data;
    });

    UserDataServices.getimages(Profile.data.uid, { offset: 0, limit: 8 }).success(function(result) {
        $scope.media = result.data;
    });

    $rootScope.$on('profileImageChanged', function(event, args) {
        $scope.profile.profile = args.data;
        User.updateLS({ image: args.data });
    });

    $rootScope.$on('coverImageChanged', function(event, args) {
        $scope.profile.cover = args.data;
        User.updateLS({ cover: args.data });
    });

    $scope.seo = {
        title: $scope.profile.name + " - @" + $scope.profile.username + " | Linkagoal",
        description: 'View ' + $scope.profile.username + ' on linkagoal, Learn about ' + $scope.profile.username + '\'s Goal(s) journey and inspiration',
        image: $scope.profile.profile.large
    }
}]);
;LinkagoalWebApp.controller('ProfileMediaCtrl', ['$scope', '$rootScope', '$stateParams', '$location', 'Profile', 'User', 'UserDataServices', 'ngProgressFactory', function($scope, $rootScope, $stateParams, $location, Profile, User, UserDataServices, ngProgressFactory) {
    $scope.notfound = false;
    if (Profile.meta.status == 404 || Profile.meta.status == 401) {
        $scope.notfound = true;
    } else {
        $scope.profile = Profile.data

        UserDataServices.getimages(Profile.data.uid).success(function(res) {
            $scope.images = res.data.images;
        })
    }

    $scope.seo = {
    	title: 'View media from ' + Profile.data.username,
    	description: 'See what '+ Profile.data.username +' is sharing on Linkagoal; global community of goal achievers',
    	image: Profile.data.profile.medium    
    }
}]);;LinkagoalWebApp.controller('AcitivityPageCtrl', ['$scope', '$stateParams', 'Post', '$filter',function($scope, $stateParams, Post, $filter) {
    $scope.isLoading = true;
    $scope.notFound = false;

    Post.get($stateParams.id).success(function(res) {
            $scope.activities = [res.data];
            $scope.isLoading = false;
            var title = $scope.activities[0].post.user.username + ' posted ' + $scope.activities[0].post.text;
            title = mentionParseTitle(title)
            title = $filter('cut')(title, false, 63, '...')
            $scope.seo = {}
            $scope.seo.title = title.htmlentities();

            $scope.seo.description = ('@'+$scope.activities[0].post.user.username + ' posted ' + $scope.activities[0].post.text).htmlentities();

            if ($scope.activities[0].post.hasOwnProperty("media")) {
                $scope.seo.image = $scope.activities[0].post.media.files[0].source.medium.src;
            }

            if ($scope.activities[0].post.hasOwnProperty("fetched_url")) {
                $scope.seo.image = $scope.activities[0].post.fetched_url.image.medium.source;
            }
            

        })
        .error(function(res) {
            if (res.meta.status == 404) {
                $scope.isLoading = false;
                $scope.notFound = true;
            }
        })
}]);


function mentionParseTitle(text) {
        var regex = /[@[0-9]+[:]([a-z|A-Z ]+)]/g;
        var idSeprator = /[0-9]+/g;
        var displaySeprator = /([a-z|A-Z ]+)/g;
        var pattern = text.match(regex);
        var textCopy = text;
       
        if (pattern != null) {
            
            for (var i = 0; i < pattern.length; i++) {
                var name = pattern[i].match(displaySeprator);
                textCopy = textCopy.replace(pattern[i], name);

            }

            return textCopy;

        } else {
            return text;
        }
    };LinkagoalWebApp.controller('DashboardCtrl', ['$scope', '$rootScope', 'FeedServices', 'UserDataServices', 'CommentDataServices', 'FileService', 'User', 'ngProgressFactory', 'localStorageService', 'Notify', 'GoalsDataServices', function($scope, $rootScope, FeedServices, UserDataServices, CommentDataServices, FileService, User, ngProgressFactory, localStorageService, Notify, GoalsDataServices) {

    $scope.splash = {}
    $scope.userVerified = User.me().verified;

    var punchLines = {}
    punchLines.day = [];
    punchLines.afternoon = [];
    punchLines.evening = [];
    punchLines.night = [];

    punchLines.day[1] = "Be the extraordinary in your ordinary life."
    punchLines.day[2] = "It's a new day, a new chapter."
    punchLines.day[3] = "Every step matters."
    punchLines.day[4] = "You can't see or hear an opportunity, you can only feel it."

    punchLines.afternoon[1] = "Be the positive impact in others life."
    punchLines.afternoon[2] = "Be the reason behind smiling faces."
    punchLines.afternoon[3] = "You can achieve anything if you have will and ability."
    punchLines.afternoon[4] = "Those who have done great things in life, have always looked beyond the limits."

    punchLines.evening[1] = "If you quit today, you'll quit tomorrow as well and you'll quit everytime forever."
    punchLines.evening[2] = "Nothing happens in life without any reason, in the end it's all about what comes out of it."
    punchLines.evening[3] = "There is no such thing as failure, it has never been."
    punchLines.evening[4] = "You matter a lot for many."

    punchLines.night[1] = "Life is the best payback with interest."
    punchLines.night[2] = "Be the change that you want."
    punchLines.night[3] = "A bad experience is a good teacher."
    punchLines.night[4] = "Every experience is worth sharing."

    var randomPunchNumber = (Math.floor(Math.random() * 4) + 1);


    if (localStorageService.get('userLoginEnter')) {
        $scope.splash.userLoginEnter = true;
        $scope.splash.partsOfDay = parseInt((new Date()).getHours());
        if ($scope.splash.partsOfDay >= 5 && $scope.splash.partsOfDay < 12) {
            $scope.splash.class = "lg-morning";
            $scope.splash.message = punchLines.day[randomPunchNumber];
        } else if ($scope.splash.partsOfDay >= 12 && $scope.splash.partsOfDay < 17) {
            $scope.splash.class = "lg-afternoon";
            $scope.splash.message = punchLines.afternoon[randomPunchNumber];
        } else if ($scope.splash.partsOfDay >= 17 && $scope.splash.partsOfDay < 21) {
            $scope.splash.class = "lg-evening";
            $scope.splash.message = punchLines.night[randomPunchNumber];
        } else {
            $scope.splash.class = "lg-night";
            $scope.splash.message = punchLines.night[randomPunchNumber];
        }
    } else { $scope.splash.userLoginEnter = false; }

    $scope.loading = {}
    $scope.loading.feeds = true;

    var page = offset = 0;
    var limit = 5;
    $scope.activities = [];

    $scope.infiniteBusy = false;
    $scope.getDashboardFeed = function() {
        if ($scope.infiniteBusy) return;
        $scope.infiniteBusy = true;
        FeedServices.getDashBoard({ offset: offset, limit: limit }).success(function(result) {
            if (result.data.length < 5) {
                $scope.infiniteBusy = true;
            } else {
                setTimeout(function() {
                    $scope.infiniteBusy = false
                }, 500)
            }
            $scope.activities = $scope.activities.concat(result.data);
            $scope.loading.feeds = false;
            offset = offset + limit;
        });
    }

    $scope.getDashboardFeed();


    $scope.sorting = "NewestToOldest";
    $scope.getMyGoals = function() {
        $scope.myGoals = [];
        $scope.loading.myGoals = true;
        UserDataServices.getMyGoals({ type: 'FULL', sorting: $scope.sorting }).success(function(result) {
            $scope.myGoals = result.data;
            $scope.loading.myGoals = false;
        });
    }
    $scope.getMyGoals();

    if (localStorageService.get("videoClosed") == 2) {
        $scope.videoWillShown = false;
    } else {
        $scope.videoWillShown = true;
    }

    $scope.closeVideo = function() {
        localStorageService.set("videoClosed", 2);
        $scope.videoWillShown = false;
    }

    $scope.$watchGroup(['loading.feeds', 'loading.myGoals'], function(newValues, oldValues, scope) {
        if ((newValues[0] == false) && (newValues[1] == false)) {
            if ($scope.splash.userLoginEnter) { localStorageService.remove("userLoginEnter") }
            setTimeout(function() {
                $scope.splash.userLoginEnter = false;
            }, 1500)
        }
    });

    $scope.getPaginationData = function() {
        getDashboardFeed();
    }

    $rootScope.$on('GOALCREATED', function(event, args) {
        $scope.activities.unshift(args.data);
    });

    $rootScope.$on('STATUS_UPDATE', function(event, args) {
        var result = {}
        result.post = args.data;
        result.feed_type = args.data.post_type
        $scope.activities.unshift(result);
    });

    $rootScope.$on('ALBUM', function(event, args) {
        var result = {}
        result.post = args.data;
        result.feed_type = args.data.post_type
        $scope.activities.unshift(result);
    });

    $scope.$on('event.delete.post', function(ev, args) {
        $scope.activities.splice(args.index, 1);
        if (args.event == 'MILESTONE_CREATED') {
            GoalsDataServices.deleteMilestone(args.activity.milestone.id).then(function(result) {
                var goal_id = getKeyById($scope.myGoals, args.activity.milestone.goal_id)
                var idx = getKeyById($scope.myGoals[goal_id].milestones, args.activity.milestone.id);
                $scope.myGoals[goal_id].milestones.splice(idx, 1);
            });
        }
    })

    UserDataServices.suggetedUsers({ by: 'fof', offset: offset, limit: 9 }).success(function(result) {
        $scope.suggestedUsers = result.data;
        //offset = offset + limit;
    });

    $scope.seo = {
        title: 'Dashboard',
        robots: 'nofollow, noindex'
    }

}]);
;LinkagoalWebApp.controller('ExploreCtrl', ['$scope', '$location', 'ExploreServices', 'ngProgressFactory', '$http', function($scope, $location, ExploreServices, ngProgressFactory, $http) {

    $scope.progressbar = ngProgressFactory.createInstance();
    $scope.progressbar.setColor('#12bcb5');
    $scope.progressbar.start();
    $scope.loading = {}
    $scope.loading.explore = true;


    ExploreServices.featuredTags().success(function(res) {
        $scope.featuredTags = res.data;
        setTimeout(function() {
            $scope.showBanner = true
        }, 300)
    });


    ExploreServices.get().success(function(result) {
        $scope.loading.explore = false;
        $scope.hotNewGoals = result.data.hotNewGoals
        $scope.popularGoals = result.data.popularGoals
        $scope.featuredUsers = result.data.featuredUsers
        $scope.categories = result.data.categories
        $scope.progressbar.complete()
    }).error(function(err) {
        $scope.loading.explore = false;
    });

    $scope.seo = {
        title: 'Explore The World of Goal Seekers',
        description: 'Explore what’s trending at the largest community of goal seekers.'
    }
}]);;LinkagoalWebApp.controller('PopularGoalsCtrl', ['$scope', 'Explore', function($scope, Explore) {

    //$scope.bannerHeading = "Popular Goals";
    $scope.bannerImage = $scope.site_url("/assets/media/img/banner/popular-goals.jpg");
    $scope.page = "popularGoals";
    $scope.Explore = new Explore();
    $scope.seo = {
    	title: 'Popular Goals at Linkagoal',
    	description: 'Explore popular goals at Linkagoal'
    }
}]);;LinkagoalWebApp.controller('HotNewGoalsCtrl', ['$scope', 'Explore', function($scope, Explore) {

    //$scope.bannerHeading = "Hot New Goals";
    $scope.bannerImage = $scope.site_url("/assets/media/img/banner/hot-new-goals.jpg");
    $scope.page = "hotNewGoals";
    $scope.Explore = new Explore();
    $scope.seo = {
    	title: 'Hot New Goals at Linkagoal',
    	description: 'Explore popular goals at Linkagoal'
    }
}]);;LinkagoalWebApp.controller('FeaturedUsersCtrl', ['$scope', 'Explore', function($scope, Explore) {
    $scope.bannerImage = $scope.site_url("/assets/media/img/banner/featured-profiles.jpg");
    $scope.Explore = new Explore();
    $scope.seo = {
    	title: 'Featured Profiles at Linkagoal',
    	description: 'Explore featured profiles at Linkagoal'
    }
    //console.log($scope.Explore);
}]);;LinkagoalWebApp.controller('CategoriesCtrl', ['$scope', '$location', '$stateParams', 'CategoriesServices', 'ngProgressFactory', '$timeout', function($scope, $location, $stateParams, CategoriesServices, ngProgressFactory, $timeout) {

    $scope.bannerHeading = $stateParams.categoryname;
    $scope.progressbar = ngProgressFactory.createInstance();
    $scope.progressbar.setColor('#12bcb5');
    $scope.progressbar.start();
    $scope.isCategory = true;
    $scope.progressbar.complete()
    $scope.disabled = true;
    $scope.isLoading = true;

    $scope.category = {};
    $scope.category_goals = []
    var limit = 6;
    CategoriesServices.get($stateParams.categoryname, { offset: 0, limit: limit }).success(function(result) {
        $scope.category = result.data;
        $scope.category_goals = result.data.goals;
        $scope.progressbar.complete()
        if (result.data.goals.length < limit) {
            $scope.disabled = true;
        } else {
            $scope.disabled = false;
        }
        $scope.isLoading = false;
    });

    var offset = 6;
    $scope.loadMoreGoals = function() {
        if (this.disabled) return;
        $scope.disabled = true;
        $scope.isLoading = true;
        CategoriesServices.get($stateParams.categoryname, { offset: offset, limit: limit }).success(function(result) {
            $scope.category_goals = $scope.category_goals.concat(result.data.goals)
            $scope.isLoading = false;
            if (result.data.goals.length < limit) {
                $scope.disabled = true;
            } else {
                $timeout(function() {
                    $scope.disabled = false;
                }, 50);
            }
            offset = offset + limit;
        });
    }
    var capitalizeFirstLetter = function(str) {
        return str.substr(0, 1).toUpperCase() + str.substr(1);
    }


    $scope.seo = {
        title: capitalizeFirstLetter($stateParams.categoryname) + ' trend at Linkagoal',
        description: 'Explore (' + $stateParams.categoryname + ') goals at linkagoal; largest community of goal achievers'
    }

}]);
;LinkagoalWebApp.controller('SubCategoriesCtrl', ['$scope', '$stateParams', 'CategoriesServices', 'ngProgressFactory', function($scope, $stateParams, CategoriesServices, ngProgressFactory) {

    $scope.bannerHeading = $stateParams.subCategory;
    $scope.progressbar = ngProgressFactory.createInstance();
    $scope.progressbar.setColor('#12bcb5');
    $scope.progressbar.start();
    $scope.loading = true;
    $scope.isCategory = false;
    $scope.disabled = true;
    $scope.isLoading = true;

    $scope.category = {};
    $scope.category_goals = []
    var limit = 6;
    CategoriesServices.getSub($stateParams.categoryname, $stateParams.subCategory, { offset: 0, limit: limit }).success(function(result) {
        $scope.category = result.data.tag;
        $scope.category_goals = result.data.goals;
        $scope.progressbar.complete()
        if (result.data.goals.length < limit) {
            $scope.disabled = true;
        } else {
            $scope.disabled = false;
        }
        $scope.isLoading = false;

    }).error(function(err) {
        $scope.category_goals = []
        $scope.progressbar.complete()
    });

    var offset = 6;
    $scope.loadMoreGoals = function() {
        if ($scope.disabled) return;
        $scope.disabled = true;
        $scope.isLoading = true;
        CategoriesServices.getSub($stateParams.categoryname, $stateParams.subCategory, { offset: offset, limit: limit }).success(function(result) {
            if (result.data.goals != 0)
                $scope.category_goals = $scope.category_goals.concat(result.data.goals)
            $scope.isLoading = false;
            if (result.data.goals.length < limit) {
                $scope.disabled = true;
            } else {
                $timeout(function() {
                    $scope.disabled = false;
                }, 50);
            }
            offset = offset + limit;
        });
    }

    var capitalizeFirstLetter = function(str) {
        return str.substr(0, 1).toUpperCase() + str.substr(1);
    }

    $scope.seo = {
        title: capitalizeFirstLetter($stateParams.subCategory) + ' trend at Linkagoal',
        description: 'Explore (' + $stateParams.subCategory + ') goals at linkagoal; largest community of goal achievers'
    }
}]);
;LinkagoalWebApp.controller('TaggedCtrl', ['$scope', '$rootScope', '$stateParams', '$location', 'ngProgressFactory','TagsDataServices', 'TaggedGoals', '$timeout', function($scope, $rootScope, $stateParams, $location, ngProgressFactory, TagsDataServices, TaggedGoals, $timeout) {

    if (TaggedGoals.data.tag.isSubCategory) {
        $location.path('/category/' + TaggedGoals.data.tag.category.route + '/' + TaggedGoals.data.tag.name);
    }

    $scope.disabled= false;
    var offset = 5;
    var limit = 5;
    $scope.goalsSet = []
    $scope.loadMoreTags= function() {
        if (this.disabled) return;
        $scope.disabled = true;
        TagsDataServices.getTaggedGoals($stateParams.name, {offset: offset, limit: limit}).then(function(result) {
            $scope.goalsSet = $scope.goalsSet.concat(result.data.data.goals)
            if (result.data.data.goals.length < limit) {
                $scope.disabled = true
            }
            else {
                $timeout(function(){
                  $scope.disabled = false;
                }, 50);
            }
            offset = offset + limit;     
        });
    }
    // $scope.loadMoreTags();
    $scope.progressbar = ngProgressFactory.createInstance();
    $scope.progressbar.setColor('#12bcb5');
    $scope.progressbar.start();
    $scope.loading = false;


    $scope.hashTagGoal = function() {
        $rootScope.createGoal('', {tag:$scope.bannerHeading})
    }

    try {
        $scope.Tag = TaggedGoals.data.tag || {}
        $scope.goalsSet = TaggedGoals.data.goals || {}
        $scope.bannerHeading = $scope.Tag.tagname || $stateParams.name;
    } catch (e) {
        $scope.bannerHeading = $stateParams.name;
        $scope.Tag = [];
        $scope.goalsSet = [];
    }

    $scope.progressbar.complete()

    $scope.seo = {
        title: '#' + $stateParams.name+ " | Linkagoal",
        description: 'Follow #' +$stateParams.name +' trend on Linkagoal'
    }

}]);;LinkagoalWebApp.controller('ProfileGoalCtrl', ['$scope', '$rootScope', '$stateParams', 'Profile', 'UserDataServices', 'ngProgressFactory', 'PageMetaData', function($scope, $rootScope, $stateParams, Profile, UserDataServices, ngProgressFactory, PageMetaData) {
    $scope.progressbar = ngProgressFactory.createInstance();
    $scope.progressbar.setColor('#12bcb5');
    $scope.progressbar.start();

    $scope.loading = {}

    if (Profile.meta.status == 404) { $location.path("/404"); }
    $scope.profile = Profile.data

    $rootScope.$on('profileImageChanged', function(event, args) {
        $scope.profile.profile = args.data;
        User.updateLS({ image: args.data });
    });

    $rootScope.$on('coverImageChanged', function(event, args) {
        $scope.profile.cover = args.data;
        User.updateLS({ cover: args.data });
    });

    UserDataServices.getUserGoals(Profile.data.username).success(function(result) {
        $scope.goals = result.data.goals;
        $scope.loading.goals = true;
        $scope.progressbar.complete()
    });

}]);;LinkagoalWebApp.controller('ProfileInterestCtrl', ['$scope', '$rootScope', '$stateParams', 'Profile', 'UserDataServices', 'ngProgressFactory', 'TagsDataServices', function($scope, $rootScope, $stateParams, Profile, UserDataServices, ngProgressFactory, TagsDataServices) {

    $scope.progressbar = ngProgressFactory.createInstance();
    $scope.progressbar.setColor('#12bcb5');
    $scope.progressbar.start();

    $scope.loading = {}

    if (Profile.meta.status == 404) { $location.path("/404"); }
    $scope.profile = Profile.data

    $rootScope.$on('profileImageChanged', function(event, args) {
        $scope.profile.profile = args.data;
        User.updateLS({ image: args.data });
    });

    $rootScope.$on('coverImageChanged', function(event, args) {
        $scope.profile.cover = args.data;
        User.updateLS({ cover: args.data });
    });

    UserDataServices.getUserInterests(Profile.data.username).success(function(result) {
        if (result.meta.status == 200) {
            $scope.interests = result.data;
        }
        $scope.progressbar.complete()
    });

    $scope.tags = [];

    $scope.interestChips = [];
    $scope.interestChips.readonly = false;
    $scope.interestChips.tags = [];

    $scope.timer;
    $scope.getMatches = function(keyword) {
        resTags = [];
        TagsDataServices.search(keyword).success(function(result) {
            resTags = result.data;
        })
        return resTags
        if ($scope.timer) {
            clearTimeout($scope.timer);
        }
        $scope.timer = setTimeout(function() {

        }, 1000);
    }

    $scope.pressEnter = function(e) {
        var autoChild = document.getElementById('InterestAuto').firstElementChild;
        var el = angular.element(autoChild);
        el.scope().$mdAutocompleteCtrl.hidden = true;
        console.log(el.scope().$mdAutocompleteCtrl);
    };
}]);;LinkagoalWebApp.controller('ProfileActivitiesCtrl', ['$scope', '$stateParams', 'UserDataServices', function($scope, $stateParams, UserDataServices) {

    var page = 0,
        offset = 0,
        limit = 5;

    $scope.activities = [];
    $scope.filter = "post";
    $scope.noMoreFeedContent = true;
    UserDataServices.getUser($stateParams.name).success(function(result) {
        $scope.profile = result.data
        $scope.noMoreFeedContent = false;
        getUserActivities($scope.profile.uid);
        $scope.getData = function() {
            getUserActivities($scope.profile.uid);
        }
    });

    $scope.isLoading = true;

    function getUserActivities(id) {
        $scope.noMoreFeedContent = true;
        UserDataServices.getUserPosts(id, { filter: $scope.filter, offset: offset, limit: limit }).success(function(result) {
            $scope.activities = $scope.activities.concat(result.data);
            page = page + 1;
            offset = page * limit;
            $scope.isLoading = false;
            if (result.data.length < limit) {
                $scope.noMoreFeedContent = true
            } else {
                $scope.noMoreFeedContent = false
            }
        });
    }

    $scope.filterActivities = function() {
        page = offset = 0
        $scope.activities = [];
        $scope.getData();
    }

    $scope.loadMoreRecords = function() {
        console.log("sdsdsd");
    }

}]);;LinkagoalWebApp.controller('LoginCtrl', ['$scope', 'UserDataServices', '$location', 'localStorageService', '$mdDialog', '$auth', function($scope, UserDataServices, $location, localStorageService, $mdDialog, $auth) {
    $scope.user = {};

    $scope.isLoading = false;
    $scope.loginForm = function() {
        var client_info = getClientInfo(window);
        params = angular.extend($scope.user, client_info);
        $scope.isLoading = true;
        var client_id = 0; //edeaeec0-7548-11e5-be18-05aee33416a8
        if (client_id = localStorageService.get('client_id')) {
            client_id = client_id;
        }
        UserDataServices.login(params, client_id).success(function(result) {
            if (result.meta.status == 200) {
                if (localStorageService.isSupported) {
                    loggedInUser = { credentials: result.data.credentials, user: result.data.user }
                    localStorageService.set("client_id", result.data.credentials.client_id);
                    localStorageService.set("loggedInUser", loggedInUser);
                    localStorageService.set("userLoginEnter", 1);
                    if ($scope.isModal) {
                        $scope.closeModal();
                    } else {
                        try {

                            if ($location.search().next) {
                                changeRoute(decodeURIComponent($location.search().next));
                            } else {
                                if (loggedInUser.user.onboarding_web == 0) {
                                    changeRoute('/welcome');
                                } else {
                                    changeRoute('/dashboard');
                                }
                            }
                        } catch (e) {
                            changeRoute('/dashboard');
                        }
                    }
                }
            } else {
                $scope.isLoading = false;
                $scope.error = result.meta.message;
            }
        }).error(function(err) {
            $scope.isLoading = false;
            $scope.error = err.meta.message;
        });
    }
    var changeRoute = function(url, forceReload) {
        $scope = $scope || angular.element(document).scope();
        if (forceReload || $scope.$$phase) { // that's right TWO dollar signs: $$phase
            window.location = url;
        } else {
            $location.path(url);
            $scope.$apply();
        }
    };

    $scope.authenticate = function(provider) {
        $auth.authenticate(provider)
            .then(function() {
                console.log(1);
                $location.path('/');
            })
            .catch(function(response) {
                console.log(response.data.message);
            });
    };

    $scope.closeModal = function() {
        $mdDialog.cancel();
    };

    $scope.seo = {
        title: "Sign in at Linkagoal",
        description: "Log into largest community of goal seekers",
    }

}]);
;LinkagoalWebApp.controller('SignupCtrl', ['$scope', 'UserDataServices', '$mdDialog', 'localStorageService', function($scope, UserDataServices, $mdDialog, localStorageService) {
    $scope.user = {};
    $scope.isLoading = false;
    $scope.email_regex = '^[a-zA-Z]+[a-zA-Z0-9._-]+@[a-z]+\.[a-z.]{2,5}$';
    $scope.username_regex = '^(?=.{3,20}$)[A-Za-z][A-Za-z0-9]+(?:[.|_][A-Za-z0-9]+)*$';

    $scope.loginForm = function() {
        // var error = validateUserInput();
        // if (error === '') {
        //     sendRegisterForm();
        // }
        sendRegisterForm();
    }
    var changeRoute = function(url, forceReload) {
        $scope = $scope || angular.element(document).scope();
        if (forceReload || $scope.$$phase) {
            window.location = url;
        } else {
            $location.path(url);
            $scope.$apply();
        }
    };

    $scope.step = true;
    $scope.user.name = "";

    function sendRegisterForm() {
        $scope.isLoading = true;
        UserDataServices.register($scope.user).success(function(result) {
            if (result.meta.status == 200) {
                params = { username: $scope.user.username, password: $scope.user.password }
                UserDataServices.login(params).success(function(user) {
                    if (localStorageService.isSupported) {
                        loggedInUser = { credentials: user.data.credentials, user: user.data.user }
                        localStorageService.set("loggedInUser", loggedInUser);
                        if ($scope.isModal) {
                            changeRoute('/welcome', true);
                        } else {
                            changeRoute('/welcome');
                        }

                    }
                });
            } else if (result.meta.status == 401) {
                $scope.user.errors = result.errors;
                $scope.isLoading = false;
            }
        }).error(function(err) {
            $scope.user.errors = err.errors;
            $scope.isLoading = false;
        });
    }

    function validateEmail(email) {
        var re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(email);
    }

    function validateUsername(username) {
        var re = /^(?=.{3,20}$)[A-Za-z][A-Za-z0-9]+(?:[.|_][A-Za-z0-9]+)*$/;
        return re.test(username);
    }

    function validateUserInput() {
        if ($scope.user.name == '' || typeof $scope.user.name === 'undefined') {
            $scope.error = "Name cannot be empty";
        } else if (($scope.user.name.length < 3)) {
            $scope.error = "Name should be atleast 3 characters long";
        } else if (!validateEmail($scope.user.user_email)) {
            $scope.error = "Enter valid email address.";
        } else if (!validateUsername($scope.user.username)) {
            $scope.error = "Enter valid username.";
        } else if ($scope.user.password == '' || typeof $scope.user.password === 'undefined') {
            $scope.error = "Password cannot be empty";
        } else {
            $scope.error = '';
        }
        return $scope.error;
    }

    $scope.closeModal = function() {
        $mdDialog.cancel();
    }

    $scope.seo = {
        title: "Sign up at Linkagoal",
        description: "Register at largest community of goal seekers",
    }

}]);
;LinkagoalWebApp.controller('GreetingController', [function() {

}]);;LinkagoalWebApp.controller('SettingsCtrl', ['$scope', '$filter', '$rootScope', '$mdDialog', 'UserDataServices', 'localStorageService', '$timeout', '$anchorScroll', function($scope, $filter, $rootScope, $mdDialog, UserDataServices, localStorageService, $timeout, $anchorScroll) {
    var user = {}

    uid = sessionUser.user.uid;

    $scope.months = ["Jan", "Feb", "March", "April", "May", "June", "July", "Aug", "Sep", "Oct", "Nov", "Dec"];


    UserDataServices.getBasicSettings().success(function(result) {
        $scope.user = result.data
        $scope.user.dob = new Date($scope.user.dob)
        $scope.userMonth = $scope.months[$scope.user.dob.getMonth()];
        $scope.userDate = $scope.user.dob.getDate();
        $scope.userYear = $scope.user.dob.getFullYear();

        UserDataServices.getUser(result.data.uid).success(function(res) {
            $scope.profile = res.data;
        })
        $scope.temp = {}
        $scope.temp.mylocation = {}
        try {
            if (!angular.equals({}, $scope.user.location)) {
                $scope.temp.mylocation.searchText = $scope.user.location.formatted_address
                $scope.temp.mylocation.selectedItem = { formatted_address: $scope.user.location.formatted_address }
            } else {
                $scope.temp.mylocation.selectedItem = null
            }
        } catch (e) {}
    });

    function initUserLocation() {
        $scope.userLocation.searchText = null;
        $scope.userLocation.selectedItem = null;
    }

    $scope.updateDobDate = function(date) {
        $scope.user.dob.setDate(date)
    }

    $scope.updateDobMonth = function(month) {
        for (var i in $scope.months) {
            if (month == $scope.months[i]) {
                $scope.user.dob.setMonth(i)
            }
        };
    }

    $scope.updateDobYear = function(year) {
        $scope.user.dob.setFullYear(year)
    }


    $scope.submitForm = function() {
        $scope.profileUpdating = true;
        if ($scope.temp.mylocation.selectedItem != null) {
            console.log($scope.temp.mylocation.selectedItem)
            $scope.user.userDefinedLocation = $rootScope.locationAddressFix($scope.temp.mylocation.selectedItem);
        }
        UserDataServices.updateProfile(uid, $scope.user).success(function() {
            $scope.profileUpdating = false;
            $scope.Notify.UImessage("Successfully Updated");
        })
    };

    $scope.updateAccountSettings = function() {
        $scope.isLoading = true;
        params = { user_email: $scope.user.user_email, privacy_type: $scope.user.privacy_type }
        UserDataServices.updateProfile($scope.user.uid, params).success(function() {
            $scope.Notify.UImessage("Successfully Updated");
            $timeout(function() {
                $scope.isLoading = false;
            }, 3000);

        })
    }

    $scope.pass = {};

    var password_flag = 0;
    $scope.password_open = function() {
        if (password_flag == 0) {
            password_flag = 1;
        } else {
            password_flag = 0;
            $scope.password_errors = [];
            $scope.pass = {};
        }
    }

    $scope.changePassword = function() {
        $scope.isChangePasswordUpdating = true;
        params = { oldpassword: $scope.pass.currentpassword, newpassword: $scope.pass.newpassword, confirmnewpassword: $scope.pass.confirmNewpassword }
        UserDataServices.changePassword(params).success(function(result) {
            if (result.meta.status == 200) {
                $timeout(function() {
                    $scope.Notify.UImessage("Successfully changed", "success", "right", "top");
                    $scope.passwordChangeMessage = true;
                    $scope.isChangePasswordUpdating = false;
                    $scope.pass.currentpassword = '';
                    $scope.pass.newpassword = '';
                    $scope.pass.confirmNewpassword = '';
                }, 2000);
            } else {
                $scope.passwordChangeMessage = true;
                $scope.isChangePasswordUpdating = false;
                $scope.password_errors = error.errors;
            }
        }).error(function(error) {
            $scope.password_errors = [];
            $scope.passwordChangeMessage = true;
            $scope.isChangePasswordUpdating = false;
            $scope.password_errors = error.errors;
        })
    }

    $scope.email_regex = '^[a-zA-Z]+[a-zA-Z0-9._-]+@[a-z]+\.[a-z.]{2,5}$';
    $scope.changeEmail = function() {
        $scope.isLoading = true;
        var params = { email: $scope.user.user_email }
        UserDataServices.validateUsernameEmail(params).success(function(res) {
            if (res.meta.success == 200) {
                $mdDialog.show({
                    templateUrl: 'partials/sub-partials/deleteConfirm.tmpl',
                    controller: function($scope, params, Notify) {
                        $scope.text = {}
                        $scope.title = "Enter your password to continue";
                        $scope.ok = "Continue"
                        $scope.textarea = true;
                        $scope.label = "Password";
                        $scope.type = "Password";
                        $scope.cancel = function() {
                            $mdDialog.cancel();
                        }
                        $scope.confirm = function() {
                            params.password = $scope.text.value;
                            $scope.isLoading = true;
                            if (params.password.length == 0) {
                                $scope.isLoading = false;
                            } else {
                                UserDataServices.changeUsernameEmail(params).success(function(result) {
                                    if (result.meta.status == 200) {
                                        $mdDialog.cancel();
                                        $scope.isLoading = false;
                                        Notify.UImessage("Successfully changed", "success", "right", "top");
                                    } else {

                                    }

                                }).error(function(err) {
                                    Notify.UImessage("Error: Password is incorrect", "error", "right", "top");
                                    $scope.isLoading = false;
                                })
                            }

                        }
                    },
                    locals: {
                        params: params,
                        Notify: $scope.Notify
                    }
                })
            } else {
                $scope.email_error = "Email is not valid";
            }
        }).error(function(err) {
            if (typeof err.data[0] != "undefined") {
                if (err.data[0].message == 'Email is null ') {
                    $scope.email_error = 'Email is should not be empty';
                } else if (typeof err.data[1] != "undefined") {
                    if (err.data[1].message == 'Email is already taken ') {
                        $scope.email_error = 'Email is already taken';
                    }
                }
            } else if (err.data['body.email']) {
                $scope.email_error = 'Email is not valid';
            }

            //$scope.email_error = err.data.email;
        });
    }

    var username_flag = 0;
    $scope.username_open = function() {
        if (username_flag == 0) {
            username_flag = 1;
        } else {
            username_flag = 0;
            $scope.username_error = null;
        }
    }

    $scope.username_regex = '^(?=.{3,20}$)[A-Za-z][A-Za-z0-9]+(?:[.|_][A-Za-z0-9]+)*$';
    $scope.changeUsername = function() {
        $scope.isLoading = true;
        var params = { username: $scope.user.username }
        UserDataServices.validateUsernameEmail(params).success(function(res) {
            if (res.meta.success == 200) {
                $scope.username_error = null;
                $mdDialog.show({
                    templateUrl: 'partials/sub-partials/deleteConfirm.tmpl',
                    controller: function($scope, params, Notify) {
                        $scope.text = {}
                        $scope.title = "Enter your password to continue";
                        $scope.ok = "Continue"
                        $scope.textarea = true;
                        $scope.label = "Password";
                        $scope.type = "Password";
                        $scope.cancel = function() {
                            $mdDialog.cancel();
                        }
                        $scope.confirm = function() {
                            params.password = $scope.text.value;
                            $scope.isLoading = true;
                            if (params.password.length == 0) {
                                $scope.isLoading = false;
                            } else {
                                UserDataServices.changeUsernameEmail(params).success(function(result) {
                                    $mdDialog.cancel();
                                    $scope.isLoading = false;
                                    Notify.UImessage("Successfully changed", "success", "right", "top");
                                }).error(function(err) {
                                    Notify.UImessage("Error: Password is incorrect", "error", "right", "top");
                                    $scope.isLoading = false;
                                })
                            }
                        }
                    },
                    locals: {
                        params: params,
                        Notify: $scope.Notify
                    }
                })
            } else {
                $scope.username_error = "Username is not valid";
            }
        }).error(function(err) {
            if (typeof err.data[0] != "undefined") {
                if (err.data[0].message == 'Username is null ') {
                    $scope.username_error = 'Username is should not be empty';
                } else if (typeof err.data[1] != "undefined") {
                    if (err.data[1].message == 'Username is already taken ') {
                        $scope.username_error = 'Username is already taken';
                    }
                }
            } else if ($scope.user.username == '') {
                $scope.username_error = 'Username is should not be empty';
            } else if (err.data['body.username']) {
                $scope.username_error = 'Username is not valid';
            }
        });
    }

    $scope.seo = {
        title: 'Settings - Profile',
        description: 'settings - profile'
    }


}]);
;LinkagoalWebApp.controller('UserEducationCtrl', ['$scope', 'UserDataServices', 'User', '$mdDialog', '$filter', '$rootScope', function($scope, UserDataServices, User, $mdDialog, $filter, $rootScope) {

    uid = User.getLoggedInUserId();

    /* Education */
    var flag= 0;
    $scope.edu_errors =[];
    $scope.abc = function() {
        if (flag == 0){
            flag =1;
            $scope.userEduInfo = []
            eduInit();
            $scope.isLoading = true;
            UserDataServices.Education.getAll(uid,{offset: 0, limit: 20}).success(function(result) {
                $scope.userEduInfo = result.data;
                $scope.isLoading = false;
            });
        }
        else {
            flag = 0;
            $scope.edu_errors =[];
        }
    }

    function eduInit() {
        $scope.eduInfo = {}
        $scope.eduInfo.organization = {}
      
    }

    eduInit();
    $scope.addNewEduInfo = function() {
        $scope.disabled = true;
        UserDataServices.Education.add(uid, $scope.eduInfo).success(function(result) {
          if (result.meta.status != 401) {
            $scope.eduInfo.to_year = new Date($scope.eduInfo.to_year).toISOString();
            $scope.eduInfo.from_year = new Date($scope.eduInfo.from_year).toISOString();
            $scope.eduInfo.id = result.data.id
            $scope.userEduInfo.unshift($scope.eduInfo);
            eduInit();
            $scope.disabled = false;
            $rootScope.Notify.UImessage("Successfully Added","success","right",'top');
          }
          else {
            $scope.edu_errors = result.errors;
          }
        }).error(function(err) {
            $scope.edu_errors = err.errors;
        });
    }

    $scope.updateEduInfo = function() {
        $scope.disabled = true;
        UserDataServices.Education.update(uid, $scope.eduInfo.id, $scope.eduInfo).success(function(result) {
            $scope.eduInfo.to_year = new Date($scope.eduInfo.to_year).toISOString();
            $scope.eduInfo.from_year = new Date($scope.eduInfo.from_year).toISOString();
            $scope.userEduInfo[index] = $scope.eduInfo;
            eduInit();
            $scope.disabled = false;
            $rootScope.Notify.UImessage("Successfully Updated","success","right",'top');
        });
    }

    var index = -1;
    $scope.editEduInfo = function(eduHistoryObj, i) {
        index = i;
        $scope.eduHistory = angular.copy(eduHistoryObj)
        eduInit();
        $scope.eduInfoEdit = true;
        $scope.eduHistory.to_year = $filter('date')(new Date($scope.eduHistory.to_year), 'yyyy');
        $scope.eduHistory.from_year = $filter('date')(new Date($scope.eduHistory.from_year), 'yyyy');
        if ($scope.eduHistory.graduated == 1) {
            // $scope.eduHistory.to_year = "";
            $scope.eduHistory.graduated = 1
        } else {
            $scope.eduHistory.graduated = 0
        }
        $scope.eduInfo = $scope.eduHistory;
    }


    $scope.deleteEduHistory = function(id, ev, idx) {
        $mdDialog.show({
            templateUrl: 'partials/sub-partials/deleteConfirm.tmpl',
            controller: function($scope, userEduInfo) {
                $scope.title = 'Are you sure you want to delete?';
                $scope.ok = 'Delete';
                $scope.cancel = function() {
                    $mdDialog.cancel();
                }
                $scope.confirm = function() {
                    $scope.isLoading= true;
                    UserDataServices.Education.delete(uid, id).success(function(result) {
                        $mdDialog.cancel();
                        userEduInfo.splice(idx, 1);
                        eduInit();
                        $scope.isLoading= false;
                        $rootScope.Notify.UImessage("Successfully Deleted","success","right",'top');

                    });


                }
            },
            locals : {
                userEduInfo: $scope.userEduInfo
            }
        })
    }

    $scope.cancelEduInfoEdit = function() {
        $scope.eduInfoEdit = false;
        eduInit();
    }
}]);;LinkagoalWebApp.controller('UserWorkCtrl', ['$scope', 'UserDataServices', 'User', '$mdDialog', '$filter', '$rootScope', function($scope, UserDataServices, User, $mdDialog, $filter, $rootScope) {

    uid = User.getLoggedInUserId();

    var flag = 0;
    $scope.work_errors = [];
    $scope.open= function() {
        if (flag == 0) {
            flag =1;
            $scope.userWorkInfo = []
            workInit();
            $scope.isLoading = true;
            UserDataServices.Work.getAll(uid, {offset: 0, limit: 20}).success(function(result) {
                $scope.userWorkInfo = result.data;
                $scope.isLoading = false;
            });
        }
        else {
            flag = 0;
            $scope.work_errors = [];
        }
    }

    /* Work */
    function workInit() {
        $scope.workInfo = {}
        $scope.workInfo.organization = {}
        $scope.workInfoEdit = false;
    }

    workInit();
    $scope.addNewWorkInfo = function() {
        $scope.disabled = true;
        UserDataServices.Work.add(uid, $scope.workInfo).success(function(result) {
          if (result.meta.status != 401 ) {
            console.log($scope.workInfo.to_year)
            $scope.workInfo.to_year = new Date($scope.workInfo.to_year).toISOString();
            $scope.workInfo.from_year = new Date($scope.workInfo.from_year).toISOString();
            $scope.workInfo._id = result.data._id
            $scope.userWorkInfo.unshift($scope.workInfo);
            workInit();
            $scope.disabled = false;
            $rootScope.Notify.UImessage("Successfully Added","success","right",'top');
          } else {
            $scope.work_errors = result.errors;
          }
        }).error(function(err) {
            $scope.work_errors = err.errors; 
        });
    }
    var index = -1;
    $scope.editWorkInfo = function(workHistoryObj, i) {
        index = i;
        $scope.workHistory = angular.copy(workHistoryObj)
        workInit();
        $scope.workInfoEdit = true;
        $scope.workHistory.to_year = $filter('date')(new Date($scope.workHistory.to_year), 'yyyy');
        $scope.workHistory.from_year = $filter('date')(new Date($scope.workHistory.from_year), 'yyyy');
        if ($scope.workHistory.is_working == 1) {
            $scope.workHistory.to_year = "";
            $scope.workHistory.is_working = true
        } else {
            $scope.workHistory.is_working = false
        }
        $scope.workInfo = $scope.workHistory;
    }
    $scope.updateWorkInfo = function() {
        $scope.disabled = true;
        UserDataServices.Work.update(uid, $scope.workInfo._id, $scope.workInfo).success(function(result) {
            $scope.workInfo.to_year = new Date($scope.workInfo.to_year).toISOString();
            $scope.workInfo.from_year = new Date($scope.workInfo.from_year).toISOString();
            $scope.userWorkInfo[index] = $scope.workInfo;
            workInit();
            $scope.disabled = false;
            $rootScope.Notify.UImessage("Successfully Updated","success","right",'top');
        });

    }

    $scope.deleteWorkHistory = function(id, ev, idx) {
        $mdDialog.show({
            templateUrl: 'partials/sub-partials/deleteConfirm.tmpl',
            controller: function($scope, userWorkInfo) {
                $scope.title = 'Are you sure you want to delete?';
                $scope.ok = 'Delete';
                $scope.cancel = function() {
                    $mdDialog.cancel();
                }
                $scope.confirm = function() {
                    $scope.isLoading= true;
                    UserDataServices.Work.delete(uid, id).success(function(result) {
                        userWorkInfo.splice(idx, 1);
                        workInit();
                        $scope.isLoading= false;
                        $mdDialog.cancel();
                        $rootScope.Notify.UImessage("Successfully Deleted","success","right",'top');
                    });


                }
            },
            locals : {
                userWorkInfo: $scope.userWorkInfo
            }
        })
        // var confirm = $mdDialog.confirm().title('Are you sure you want to delete?').content("").ariaLabel('Delete').targetEvent(ev).ok('Delete').cancel('Cancel');
        // $mdDialog.show(confirm).then(function() {
        //     UserDataServices.Work.delete(uid, id).success(function(result) {
        //         $scope.userWorkInfo.splice(idx, 1);
        //         workInit();
        //     });
        // }, function() {});
    }

    $scope.cancelWorkInfoEdit = function() {
        $scope.workInfoEdit = false;
        workInit();
    }
}]);;// LinkagoalWebApp.controller('AccountSettingsCtrl', ['$scope', 'UserDataServices', 'User', 'PageMetaData', '$timeout', '$mdDialog', '$location', function($scope, UserDataServices, User, PageMetaData, $timeout, $mdDialog, $location) {
//     $scope.isChangePasswordUpdating = false;
//     PageMetaData.setTitle("Settings")
//     UserDataServices.getBasicSettings().success(function(result) {
//         $scope.user = result.data;
//         UserDataServices.getActiveSession().success(function(res) {
//             $scope.userSessions = res.sessions;
//             $scope.client_id = User.getClientId();
//         })

//         UserDataServices.getBlockedUsers().success(function(res) {
//             $scope.blockedUsers = res.data;
//         })

//     });

//     $scope.changePassword = function() {
//         $scope.isChangePasswordUpdating = true;
//         params = { oldpassword: $scope.currentpassword, newpassword: $scope.newpassword, confirmnewpassword: $scope.confirmNewpassword }
//         UserDataServices.changePassword(params).success(function(result) {
//             console.log(result);
//             if (result.status == 200) {
//                 $scope.passwordChangeMessage = true;
//                 $scope.isChangePasswordUpdating = false;
//                 $scope.Notify.UImessage("Successfully changed");
//             } else {
//                 $scope.passwordChangeMessage = true;
//                 $scope.isChangePasswordUpdating = false;
//                 $scope.Notify.UImessage(result.message);
//             }
//         }).error(function(error) {
//             $scope.passwordChangeMessage = true;
//             $scope.isChangePasswordUpdating = false;
//             if (error.meta == undefined) {
//                 $scope.Notify.UImessage(error.message, "error", "right", 'top');
//             } else {
//                 $scope.Notify.UImessage(error.meta.message, "error", "right", 'top');
//             }
//         })
//     }
//     $scope.unBlockUser = function(id, idx) {
//         UserDataServices.unBlockUser(id).success(function(res) {
//             $scope.Notify.UImessage("Successfully Unblocked", "success", "right", 'top');
//             $scope.blockedUsers.splice(idx, 1);
//         })
//     }


//     $scope.updateAccountSettings = function() {
//         $scope.isLoading = true;
//         params = { user_email: $scope.user.user_email, privacy_type: $scope.user.privacy_type }
//         UserDataServices.updateProfile($scope.user.uid, params).success(function() {
//             $scope.Notify.UImessage("Successfully Updated");
//             $timeout(function() {
//                 $scope.isLoading = false;
//             }, 3000);

//         })
//     }

//     $scope.$watch('user.privacy_type', function(newValue, oldValue) {
//         console.log(oldValue, newValue);
//     })

//     $scope.revokeSession = function(id, $index) {
//         UserDataServices.revokeSession(id).success(function(res) {
//             $scope.userSessions.splice($index, 1);
//         })
//     }
//     $scope.privacy = {};
//     $scope.data = {};
//     $scope.deactivateAccount = function() {
//         var params = {
//             option_id: $scope.data.group1,
//             details: $scope.privacy.why
//         }
//         $mdDialog.show({
//             templateUrl: 'partials/sub-partials/deleteConfirm.tmpl',
//             controller: function($scope) {
//                 $scope.title = 'Are you sure you want to deactivate your account?';
//                 $scope.ok = 'Confirm';
//                 $scope.confirm = function() {
//                     $scope.isLoading = true;
//                     UserDataServices.deactivateAccount(params).success(function(res) {
//                         $scope.title = 'You have successfully deactivated your account';
//                         $scope.content = 'click ok to continue';
//                         $scope.ok2 = 'ok';
//                         $scope.ok = null;
//                         $scope.isLoading = false;
//                     })
//                 }
//                 $scope.confirm2 = function() {
//                     $location.path('/logout');
//                     $mdDialog.cancel();
//                 }
//                 $scope.cancel = function() {
//                     $mdDialog.hide();
//                 }
//             }
//         })
//     }



// }]);

LinkagoalWebApp.controller('AccountSettingsCtrl', ['$scope', 'UserDataServices', 'User', 'PageMetaData', '$timeout', '$mdDialog', '$location', function($scope, UserDataServices, User, PageMetaData, $timeout, $mdDialog, $location) {
    var session_flag = 0;
    $scope.sessionOpen = function() {
        if (session_flag == 0) {
            session_flag = 1;
            $scope.userSessions = []
            $scope.isSessionLoading = true;
            UserDataServices.getBasicSettings().success(function(result) {
                $scope.user = result.data;
                UserDataServices.getActiveSession().success(function(res) {
                    $scope.userSessions = res.sessions;
                    $scope.client_id = User.getClientId();
                    $scope.isSessionLoading = false;
                })
            });
        }
        else {
            session_flag = 0;
        }
    }

    var blockuser_flag = 0;
    $scope.blockuserOpen = function() {
        if (blockuser_flag == 0) {
            blockuser_flag = 1;
            $scope.blockedUsers = [];
            $scope.isBlockeduserLoading = true;
            UserDataServices.getBasicSettings().success(function(result) {
                $scope.user = result.data;
                UserDataServices.getBlockedUsers().success(function(res) {
                    $scope.blockedUsers = res.data;
                    $scope.isBlockeduserLoading = false;
                })
            });
        }
        else {
            blockuser_flag = 0;
        }
    } 

    $scope.revokeSession = function(id, $index) {
        UserDataServices.revokeSession(id).success(function(res) {
            $scope.userSessions.splice($index, 1);
        })
    }

    $scope.unBlockUser = function(id, idx) {
        UserDataServices.unBlockUser(id).success(function(res) {
            $scope.Notify.UImessage("Successfully Unblocked", "success", "right", 'top');
            $scope.blockedUsers.splice(idx, 1);
        })
    }

    $scope.privacy = {};
    $scope.data = {};
    $scope.deactivateAccount = function() {
        var params = {
            option_id: $scope.data.group1,
            details: $scope.privacy.why
        }
        $mdDialog.show({
            templateUrl: 'partials/sub-partials/deleteConfirm.tmpl',
            controller: function($scope) {
                $scope.title = 'Are you sure you want to deactivate your account?';
                $scope.ok = 'Confirm';
                $scope.confirm = function() {
                    $scope.isLoading = true;
                    UserDataServices.deactivateAccount(params).success(function(res) {
                        $scope.title = 'You have successfully deactivated your account';
                        $scope.content = 'click ok to continue';
                        $scope.ok2 = 'ok';
                        $scope.ok = null;
                        $scope.isLoading = false;
                    })
                }
                $scope.confirm2 = function() {
                    $location.path('/logout');
                    $mdDialog.cancel();
                }
                $scope.cancel = function() {
                    $mdDialog.hide();
                }
            }
        })
    }

    $scope.$watch('user.privacy_type', function(newValue, oldValue) {
        console.log(oldValue, newValue);
    })

}]);;LinkagoalWebApp.controller('SettingsSocialCtrl', [function() {

}]);;LinkagoalWebApp.controller('BackgroundSettingsCtrl', ['$scope', 'PageMetaData', function($scope, PageMetaData) {
    PageMetaData.setTitle("Settings")
}]);;LinkagoalWebApp.controller('NotificationsSettingsCtrl', ['$scope', 'NotificationDataServices', 'PageMetaData', function($scope, NotificationDataServices, PageMetaData) {
    PageMetaData.setTitle("Settings")

    // NotificationDataServices.settings().success(function(res) {
    //     console.log(res)
    //     // $scope.isLoading = false;
    //     $scope.notificationsSettings = res.data
    // });

    var notification_flag_alert = 0;
    $scope.openNotificationsAlert = function() {
        if (notification_flag_alert == 0) {
            notification_flag_alert = 1;
            if (typeof $scope.notificationsSettings == "undefined") {
                $scope.isLoading = true;
                NotificationDataServices.settings().success(function(res) {
                    $scope.isLoading = false;
                    $scope.notificationsSettings = res.data
                });
            }
            // $scope.isLoading = true;

        } else {
            notification_flag_alert = 0;
        }

    }

    var notification_flag_email = 0;
    $scope.openNotificationsEmail = function() {
        if (notification_flag_email == 0) {
            notification_flag_email = 1;
            if (typeof $scope.notificationsSettings == "undefined") {
                $scope.isLoading = true;
                NotificationDataServices.settings().success(function(res) {
                    $scope.isLoading = false;
                    $scope.notificationsSettings = res.data
                });
            }
            // $scope.isLoading = true;

        } else {
            notification_flag_email = 0;
        }

    }

    var notification_flag_push = 0;
    $scope.openNotificationsPush = function() {
        if (notification_flag_push == 0) {
            notification_flag_push = 1;
            if (typeof $scope.notificationsSettings == "undefined") {
                $scope.isLoading = true;
                NotificationDataServices.settings().success(function(res) {
                    $scope.isLoading = false;
                    $scope.notificationsSettings = res.data
                });
            }
            // $scope.isLoading = true;

        } else {
            notification_flag_push = 0;
        }

    }

    $scope.switchLocal = function(settings) {
        params = { id: settings.id, toast: settings.toast }
        updateNotificationSettings(params);
    }

    $scope.switchEmail = function(settings) {
        params = { id: settings.id, email: settings.email }
        updateNotificationSettings(params);
    }

    $scope.switchMobile = function(settings) {
        params = { id: settings.id, mobile: settings.mobile }
        updateNotificationSettings(params);
    }

    function updateNotificationSettings(params) {
        NotificationDataServices.update(params).success(function(res) {

        })
    }

}]);
;LinkagoalWebApp.controller('SearchCtrl', [function() {

}]);;LinkagoalWebApp.controller('SearchGoalsProfilesTagsCtrl', ['$scope', '$state', '$rootScope', '$location', 'Search', function($scope, $state, $rootScope, $location, Search) {

    $scope.selectedIndex = $state.current.data.selected;
    $scope.query = $location.search().q || null;
    $scope.search = new Search();

    $rootScope.$on('$locationChangeSuccess', function(event){
    	$scope.query = $location.search().q || null;
        $scope.search = new Search();
    });
}]);
;LinkagoalWebApp.controller('AppPageCtrl', ['$scope', function($scope) {

}]);;LinkagoalWebApp.controller('LoggedOutCtrl', ['$scope', 'localStorageService', '$rootScope', 'UserDataServices', function($scope, localStorageService, $rootScope, UserDataServices) {
    if ($rootScope.isLoggedIn()) {
        UserDataServices.logout().success(function(res) {
            localStorageService.remove("loggedInUser");
        }).error(function(err) {})
        $rootScope.chatFactory.disconnect();
    }

    $scope.seo = {
        title: "Logout",
        description: "End your session by logging out from linkagoal account",
        robots: "nofollow, noindex"
    }
}]);
;LinkagoalWebApp.controller('HelpCtrl', 'PageMetaData', [function(PageMetaData) {
    PageMetaData.setTitle('Help-Centre');
}]);;LinkagoalWebApp.controller('CareersCtrl', ['$scope', function($scope) {
    $scope.seo = {
        title: "Careers at Linkagoal",
        description: "Seek Careers at Linkagoal"
    }
}]);
;LinkagoalWebApp.controller('PrivacyCtrl', ['$scope', function($scope) {
    $scope.seo = {
        title: "Privacy Policy – Linkagoal",
        description: "Please read the privacy policy"
    }
}]);
;LinkagoalWebApp.controller('CopyrightCtrl', ['$scope', function($scope) {
	$scope.seo = {
		title : 'Copyrights - Linkagoal'
	}
}]);;LinkagoalWebApp.controller('TermsAndConditionCtrl', ['$scope', function($scope) {
	$scope.seo = {
		title: 'Terms of Use - Linkagoal'
	}
}]);;LinkagoalWebApp.controller('AboutCtrl', ['$scope', 'ExploreServices', function($scope, ExploreServices) {
    $scope.isLoading = true;

    ExploreServices.popularGoals().success(function(result) {
        $scope.goalsSet = result.data.goals
        $scope.isLoading = false;
    })

    $scope.seo = {
        title: "About Linkagoal – What is Linkagoal",
        description : "Linkagoal is a goal based social network, it came into existence so that user can create goals and link them towards success."
    }

}]);;LinkagoalWebApp.controller('404Ctrl', [function() {}]);;LinkagoalWebApp.controller('ForgotCtrl', ['$scope', 'UserDataServices', function($scope, UserDataServices) {
    $scope.isLoading = false;
    $scope.success = false;
    $scope.user = {};
    $scope.submitForm = function() {
        $scope.isLoading = true;
        $scope.success = false;
        $scope.error = '';
        UserDataServices.forgot({ user_email: $scope.user.email })
            .success(function(res) {
                $scope.success = true;
                $scope.isLoading = false;
            })
            .error(function(err) {
                if (err.meta.status == 404)
                    $scope.error = "User not found"
                if (err.meta.status == 401)
                    $scope.error = "Error, please try agian"
                $scope.isLoading = false;
            })
    }

    $scope.seo = {
        title: "Forgot?",
        description: "Reset your password on Linkagoal.",
        robots: "nofollow, noindex"
    }
}]);
;LinkagoalWebApp.controller('ForgotResetCtrl', ['$scope', '$stateParams', 'UserDataServices', function($scope, $stateParams, UserDataServices) {
    $scope.isLoading = false;
    $scope.success = false;
    $scope.keyVerificationLoading = true;
    $scope.user = {};

    UserDataServices.verifyKey($stateParams.key)
        .success(function(res) {
            if (res.meta.status != 401) {
                $scope.keyVerificationLoading = false;
                $scope.keySuccess = true;
                $scope.user.verificationkey = $stateParams.key
            }
            else {
                $scope.error_message = res.meta.message;
            }
        })
        .error(function(err) {
            $scope.keyVerificationLoading = false;
            $scope.keySuccess = false;
             $scope.error_message = err.meta.message;
        });

    $scope.submitForm = function() {
        $scope.isLoading = true;
        UserDataServices.resetPassword($scope.user)
            .success(function(res) {
                $scope.success = true;
                $scope.isLoading = false;
            })
            .error(function(err) {
                if (err.meta.status == 404)
                    $scope.error = "Password do not match"
                if (err.meta.status == 401)
                    $scope.error = "Error, please try agian later"
                $scope.isLoading = false;
            });
    }

}]);LinkagoalWebApp.controller('CreateCtrl', ['$scope', '$rootScope', '$mdDialog', 'GoalsDataServices', 'CategoriesServices', 'PrivacyServices', 'Post', 'FileService', 'SearchDataServices', 'UrlService', '$q', '$http', 'hotkeys', '$mdConstant', function($scope, $rootScope, $mdDialog, GoalsDataServices, CategoriesServices, PrivacyServices, Post, FileService, SearchDataServices, UrlService, $q, $http, hotkeys, $mdConstant) {

    $scope.tab = 1;
    $scope.createControllerTab = function(newTab) {
        $scope.tab = newTab;
    };
    $scope.isCreateControllerTab = function(tabNum) {
        return $scope.tab === tabNum;
    };
    $scope.createGoalCollapsed = false;
    $scope.openFullcreateGoalController = function() {
        if ($scope.createGoalCollapsed == false) {
            $scope.createGoalCollapsed = true;
        }
    }

    hotkeys.add({
        combo: 'c+g',
        description: 'Create Goal',
        callback: function() {
            window.scrollTo(0,0)
            $scope.tab = 1;
            $scope.openFullcreateGoalController();
            $scope.goalInputFocus = true;
        }
    });

    hotkeys.add({
        combo: 's+p',
        description: 'Share Post',
        callback: function() {
            window.scrollTo(0,0)
            $scope.tab = 2;
            $scope.postfocus = true;
        }
    });

    $scope.loadCategories = function() {
        $scope.categories = $rootScope.goalCategories;
    }

    $scope.privacyScope = $rootScope.privacyOptions;


    $scope.goal = {};
    $scope.readonly = false;
    $scope.creatingGoal = false;
    $scope.tags = [];
    $scope.selectedImage = false;


    $scope.goalImageModal = function(ev) {
        $mdDialog.show({
            controller: ['$scope', function($scope) {
                $scope.cancel = function() {
                    $mdDialog.hide();
                }

                $scope.imageType = "goal";
                $scope.aspectRatio = 49 / 17;
                $scope.firstTabName = "Upload Goal Image";
                //$scope.secondTabName = "Suggested Goal Image";

                //UserDataServices.suggestedCoverImages().success(function(res){
                $scope.suggestedImages = []
                    //})

                $scope.$on('ev_imageCropperSave', function(event, args) {
                    $rootScope.$emit('goalImageCropped', args);
                    $scope.cancel();
                });

            }],
            templateUrl: 'partials/sub-partials/imageupload-modal.html',
            targetEvent: ev,
        })
    }

    $rootScope.$on('goalImageCropped', function(event, args) {
        $scope.goal.attach_id = args.data.fileId;
        $scope.selectedImage = args.data.file
    });

    function resetGoalController() {
        $scope.goal.goal_name = "";
        $scope.goal.goal_description = ""
        $scope.goal.category_id = 0;
        $scope.tags = [];
        delete $scope.goal.attach_id;
        $scope.selectedImage = false;
        $scope.goal.userDefinedLocation = null;
        $scope.insertLocation = false;

    }

    function initGoalLocation() {
        $scope.goal.location.searchText = null;
        $scope.goal.location.selectedItem = null;
    }

    /*    if($scope.goal.startDate > $scope.goal.endDate){
          //throw err;
          console.log('nope not allowed');
        }*/
    $scope.keys = [$mdConstant.KEY_CODE.ENTER, $mdConstant.KEY_CODE.COMMA, $mdConstant.KEY_CODE.SPACE];

    $scope.newHash = function(chip) {
        var patt = new RegExp('([A-Za-z0-9_]+)');
        var a = patt.exec(chip)
        if (a != null) {
            if (a != '') {
                return { name: a[0] }
            }
        } else {
            return null;
        }
    }

    try {
        if (Object.keys($scope.$parent.$parent.preData).length > 0) {
            $scope.tags.push({name: $scope.$parent.$parent.preData.tag});
            $scope.openFullcreateGoalController();
            $scope.insertTags = 1;
        }
    } catch(e) {}

    $scope.createGoal = function() {
        $scope.creatingGoal = true;
        //$scope.goal.tags = $scope.tags.toString();
        $scope.goal.startDate = $scope.start_date;
        $scope.goal.endDate = $scope.end_date;
        var tags = []
        for (var i = 0; i < $scope.tags.length; i++) {
            tags.push('#' + $scope.tags[i].name);
        }
        $scope.goal.tags = tags.toString();
        if ($scope.goal.location.selectedItem != null) {
            $scope.goal.userDefinedLocation = $rootScope.locationAddressFix($scope.goal.location.selectedItem);
            initGoalLocation();
        }

        if ($scope.goal_scope) {
            $scope.goal.scope_id = $scope.goal_scope.id;
        }

        GoalsDataServices.createGoal($scope.goal).success(function(res) {
            console.log('This is the creation button call');
            $scope.creatingGoal = false;
            resetGoalController();
            $scope.createGoalCollapsed = false;
            $rootScope.Notify.UImessage("Goal successfully created", "success", "right");
            $rootScope.$broadcast('GOALCREATED', { data: res.data });
            try {
                $scope.$parent.cancel();
            } catch (e) {}
        })
    }


    $scope.post = {}
        //$scope.post.text = "";
    $scope.post.message = "";
    $scope.post.files = [];
    var fileCounter = 0;

    $scope.addPostImage = function(files) {
        makePostReady(files).then(function() {
            $scope.isPostReady = false;
        })
    }

    var makePostReady = function(files) {
        var defer = $q.defer();
        var counter = 0;
        if (files == null || files[0] == undefined) {defer.reject();} else {
            $scope.removePostVideo();
            angular.forEach(files, function(file, key) {

                file.isProcessing = true;
                file.progressPercentage = 0;
                $scope.post.files.push(file)
                uploadFile(file, "image", fileCounter).then(function(res) {
                    counter++;
                    if (res.result.meta.status == 200) {
                        res.result.data.isProcessing = false;
                        $scope.post.files[res.key] = res.result.data;
                        if (files.length == counter) {
                            defer.resolve();
                        }

                    }
                })
                fileCounter = (fileCounter + 1);
            });
            
        }
        return defer.promise;
    }

    $scope.post = {}
    $scope.post.text = "";
    $scope.post.file = false;
    $scope.post.video = [];

    $scope.createPost = function() {
        //$scope.creatingPost = true;

        if ($scope.post.location.selectedItem != null) {
            $scope.post.userDefinedLocation = $rootScope.locationAddressFix($scope.post.location.selectedItem);
        }

        if ($scope.post.files.length > 0) {
            $scope.post.attach_id = [];
            angular.forEach($scope.post.files, function(file, key) {
                $scope.post.attach_id.push(file.fileId)
            });
        }

        if ($scope.post_scope) {
            $scope.post.scope_id = $scope.post_scope.id;
        }

        if (Object.keys($scope.post.video).length > 0) {
            $scope.post.attach_id = [$scope.post.video.fileId];
            $scope.removePostVideo();
        }

        Post.create($scope.post).success(function(res) {
            $scope.post.text = "";
            $scope.post.attach_id = null
            $scope.removeAllPostImages();
            $scope.removeLinkFromPost();
            $scope.removePostVideo();
            $scope.post.location.selectedItem = null;
            $scope.post.location.searchText = "";
            $scope.insertPostLocation = false;
            $rootScope.$broadcast(res.data.post_type, { data: res.data });
            $scope.Notify.UImessage("Successfully Posted", "info", "right");
            $scope.creatingPost = false;

        })
    }

    $scope.post.files = []

    $scope.addPostVideo = function(files) {
        if (files == null || files[0] == null) return;
        angular.forEach(files, function(file, key) {
            $scope.post.video = file;
            file.isProcessing = true;
            file.progressPercentage = 0;
            $scope.removeAllPostImages();
            uploadFile(file, "video").then(function(res) {
                if (res.result.meta.status == 200) {

                    $scope.post.video = res.result.data;
                    $scope.post.video.isProcessing = false;
                }
            })
        })
    }

    function uploadFile(file, fileType, key) {
        FileService.setType("post");
        key = key || 0;
        return FileService.uploadFile(file, fileType).then(function(result) {
            return { result: result.data, key: key };
        }, function(err) {
            $rootScope.Notify.UImessage("There was an error in uploading, please try in a while", "error", "right", 'top');
        })
    }

    $scope.removeImage = function() {
        $scope.selectedImage = false;
        $scope.goal.attach_id = null;
    }

    $scope.removeAllPostImages = function() {
        $scope.post.files = [];
        fileCounter = 0;
    }

    $scope.removePostVideo = function(index) {
        $scope.post.video = [];
    }

    $scope.removePostImage = function(index) {
        $scope.post.files.splice(index, 1);
        fileCounter = fileCounter - 1;
        if ( fileCounter == 0 ) {
            $scope.isPostReady = true;
        }
    }

    $scope.onPostChange = function(files) {
        if (files[0] == undefined) return;
        $scope.post.file = files[0]
        $scope.fileExt = files[0].name.split(".").pop();
        $scope.removeLinkFromPost();
    }

    $scope.isImage = function(ext) {
        if (ext) {
            return ext == "jpg" || ext == "jpeg" || ext == "gif" || ext == "png"
        }
    }

    $scope.urlLink = "";
    $scope.addLink = function() {
        $scope.isUrlLoading = true;
        UrlService.fetch($scope.urlLink).success(function(res) {
            $scope.isUrlLoading = false;
            $scope.removeAllPostImages();
            $scope.post.link = res.data
            $scope.post.fetched_url_id = res.data.id
            $scope.urlLink = "";
        })
    }

    $scope.removeLinkFromPost = function() {
        delete $scope.post.fetched_url_id;
        delete $scope.post.link;
        $scope.insertLink = 0;
    }

    $scope.removeLocationFromPost = function() {
        delete $scope.post.location_id;
        delete $scope.post.location.selectedItem;
    }

    $scope.$watchGroup(['post.text', 'post.attach_id', 'post.fetched_url_id'], function(newValues, oldValues, scope) {
        if ((newValues[0] != "") || (newValues[1] != null) || (newValues[2] != null)) {
            $scope.isPostReady = false;
        } else {
            $scope.isPostReady = true;
        }
    });

}]);
;LinkagoalWebApp.controller('GoalImageCtrl', ['$scope', '$rootScope', '$mdDialog', 'GoalsDataServices', function($scope, $rootScope, $mdDialog, GoalsDataServices) {
    $scope.goalImageModal = function(id, ev) {
        $mdDialog.show({
            controller: ['$scope', function($scope) {
                $scope.cancel = function() {
                    $mdDialog.hide();
                }

                $scope.firstTabName = "Upload Goal Image";
                //$scope.secondTabName = "Suggested Goal Image";
                $scope.imageType = "goal";
                $scope.aspectRatio = 49 / 17;

                //GoalsDataServices.suggestedImages().success(function(res){
                $scope.suggestedImages = []
                    //})

                $scope.$on('ev_imageCropperSave', function(event, args) {
                    params = { attach_id: args.data.fileId }
                    GoalsDataServices.changeImage(id, params).success(function() {
                        $scope.imageProcessingLoader = false;
                        $rootScope.$broadcast('goalImageChanged', { data: args.data.file });
                        $mdDialog.hide();
                    })
                });

            }],
            templateUrl: 'partials/sub-partials/imageupload-modal.html',
            targetEvent: ev,
        })
    }
}]);LinkagoalWebApp.controller('GoalPageCtrl', ['$scope', 'GoalMain', '$location', '$rootScope', '$stateParams', '$mdDialog', 'GoalsDataServices', 'FileService', 'User', 'CommentDataServices', 'MilestoneServices', 'UrlService', 'Goals', function($scope, GoalMain, $location, $rootScope, $stateParams, $mdDialog, GoalsDataServices, FileService, User, CommentDataServices, MilestoneServices, UrlService, Goals) {

    if (GoalMain.data.goal.link != $location.path()) {
        $location.path(GoalMain.data.goal.link);
    }

    $scope.pageLoaded = false;
    $scope.Goals = new Goals(GoalMain.data.goal.id);
    var fileCounter = 0;

    $scope.removePostImage = function(index) {
        $scope.newProgress.file.splice(index, 1);
        fileCounter = fileCounter - 1;
    }
    GoalsDataServices.getMilestones(GoalMain.data.goal.id).success(function(result) {
        $scope.milestones = result.data;
    })

    if ($location.$$search.tab == 'milestones') { $scope.selectedIndex = 1; } else { $scope.selectedIndex = 0; }

    $scope.loading = {}
    $scope.loading.contribution = true;
    $scope.loading.feeds = true;

    /* Progress Update */
    $scope.newProgress = {}
    $scope.newProgress.text = '';
    $scope.newProgress.file = [];
    $scope.newProgress.processing = false;
    $scope.newProgress.urlLink = "";

    $scope.newProgress.onChange = function(files) {
        if (files[0] == undefined) return;
        $scope.newProgress.file = files[0];
    }

    $scope.addProgressImage = function(files) {
        if (files == null || files[0] == undefined) return;
        FileService.setType("post");
        return FileService.uploadFile(files[0]).then(function(result) {
            $scope.newProgress.file.push(result.data.data)
            fileCounter = (fileCounter + 1);
        })
    }

    $scope.updateProgress = function(gid) {

        $scope.newProgress.processing = true;
        params = $scope.newProgress;
        if ($scope.newProgress.location) {
            params.userDefinedLocation = $rootScope.locationAddressFix($scope.newProgress.location);
        }
        if ($scope.newProgress.file.length > 0) {
            params.attach_id = $scope.newProgress.file[0].fileId;
        }
        $scope.isUpdateLoading = true;
        GoalsDataServices.postProgress(gid, params).then(function(result) {
            $scope.isUpdateLoading = false;
            $scope.newProgress.file = [];
            $scope.newProgress.processing = false
            $scope.newProgress.text = "";
            $scope.newProgress.location = undefined;
            $scope.removeLinkFromProgress();
            result.data.data.feed_type = "PROGRESS_UPDATED";
            $scope.Goals.addNewFeed(result.data.data);
            //$scope.activities.unshift(result.data.data);
        });
    }

    $scope.removeAllImages = function() {
        $scope.newProgress.file = false;
    }

    $scope.addLink = function() {
        $scope.isUrlLoading = true;
        UrlService.fetch($scope.newProgress.urlLink).success(function(res) {
            $scope.isUrlLoading = false;
            $scope.removeAllImages();
            $scope.newProgress.link = res.data
            $scope.newProgress.fetched_url_id = res.data.id
            $scope.newProgress.urlLink = "";
        })
    }

    $scope.removeLocationFromProgress = function() {
        $scope.newProgress.location = undefined;
    }

    $scope.removeLinkFromProgress = function() {
        delete $scope.newProgress.fetched_url_id;
        delete $scope.newProgress.link;
        $scope.insertLink = 0;
    }

    /* Progress Update */


    $scope.newMilestone = {}
    $scope.newMilestone.text = ""
    $scope.newMilestone.processing = false;

    $scope.$watch('newMilestone.text', function(newValue, oldValue) {
        if ((typeof newValue !== undefined) && (newValue.length > 1)) {
            $scope.newMilestone.hint = true;
        } else { $scope.newMilestone.hint = false; }
    });


    $scope.addMilestone = function(gid) {
        $scope.newMilestone.processing = true;
        var params = { text: $scope.newMilestone.text, seq_number: (($scope.milestones.length + (1) * 1)) }
        GoalsDataServices.postMilestone(gid, params).success(function(result) {
            $scope.newMilestone.processing = false;
            $scope.newMilestone.text = "";
            result.data.feed_type = "MILESTONE_CREATED";
            $scope.Goals.addNewFeed(result.data);

            $scope.milestones = $scope.milestones.concat(result.data.milestone);
            $rootScope.Notify.UImessage("Successfully Added", "success", "right", 'top');
        });
    }

    $scope.deleteMilestone = function(milestone, ev) {
        // Appending dialog to document.body to cover sidenav in docs app
        var confirm = $mdDialog.confirm()
            .title('Are you sure you want to delete your milestone?')
            .content(milestone.text)
            .ariaLabel('Delete Milestone')
            .targetEvent(ev)
            .ok('Delete')
            .cancel('Cancel');
        $mdDialog.show(confirm).then(function() {
            GoalsDataServices.deleteMilestone(milestone.id).then(function(result) {
                var idx = getKeyById($scope.milestones, milestone.id)
                $scope.milestones.splice(idx, 1);

                for (var i = 0; i < $scope.Goals.items.length; i++) {
                    if ((typeof $scope.Goals.items[i].milestone != "undefined") && ($scope.Goals.items[i].milestone.id == milestone.id)) {
                        $scope.Goals.deleteFeed(i);
                        $rootScope.Notify.UImessage("Successfully Deleted", "success", "right", 'top');
                    }
                }
            });
        }, function() {

        });
    };

    $scope.achieveMilestone = function(milestone, ev) {
        $mdDialog.show({
            locals: { milestone: milestone },
            controller: ['$scope', 'MilestoneServices', 'milestone', function($scope, MilestoneServices, milestone) {
                $scope.milestone = milestone;
                $scope.cancel = function() {
                    $mdDialog.hide();
                }

                $scope.acheiveMilestoneNow = function(id) {
                    params = { text: $scope.text }
                    $scope.isLoading = true;
                    MilestoneServices.achieve(id, params).success(function(result) {
                        $scope.isLoading = false;
                        milestone.status = "COMPLETED";
                        result.data.feed_type = "MILESTONE_COMPLETED";
                        $rootScope.$broadcast('MILESTONECOMPLETED', { data: result.data });
                        $mdDialog.hide();
                    })
                }
            }],
            templateUrl: 'partials/sub-partials/milestone-com-modal.tmpl',
            targetEvent: ev,
        })
    }

    $scope.achieveGoal = function(goal, ev) {
        if (goal.status == 'COMPLETED') return false;

        $mdDialog.show({
            locals: { goal: goal },
            controller: ['$scope', 'GoalsDataServices', 'goal', function($scope, GoalsDataServices, goal) {
                $scope.goal = goal;
                $scope.cancel = function() {
                    $mdDialog.hide();
                }
                $scope.isLoading = false;
                $scope.acheiveNow = function(id) {
                    $scope.isLoading = true;
                    params = { text: $scope.text }
                    GoalsDataServices.achieve(id, params).then(function(result) {
                        goal.status = "COMPLETED";
                        $scope.isLoading = false;
                        $mdDialog.hide();
                    })
                }
            }],
            templateUrl: 'partials/sub-partials/goal-modal-achieved.tmpl',
            targetEvent: ev,
        })
    }

    $rootScope.$on('goalImageChanged', function(event, args) {
        $scope.goal.media = args.data;
    });

    $rootScope.$on('MILESTONECOMPLETED', function(event, args) {
        $scope.Goals.addNewFeed(args.data);
    });

    $rootScope.$on('event.delete.post', function(event, args) {
        console.log(args.activity, args.index)
        if (args.event == 'CONTRIBUTION') {
            $scope.contributions.splice(args.index, 1);
        } else if (args.activity.feed_type == 'PROGRESS_UPDATED') {
            $scope.Goals.deleteFeed(args.index);
        } else if (args.activity.feed_type == 'MILESTONE_CREATED') {
            $scope.Goals.deleteFeed(args.index);
            GoalsDataServices.deleteMilestone(args.activity.milestone.id).then(function(result) {
                var idx = getKeyById($scope.milestones, args.activity.milestone.id)
                $scope.milestones.splice(idx, 1);
            });
        }
    })

    $scope.seo = {};

    $scope.seo.title = ($scope.goal.user.name + " - @" +GoalMain.data.goal.user.username + ' goal is to '+ GoalMain.data.goal.name+' ?').htmlentities();
    $scope.seo.description = ('Learn more about '+GoalMain.data.goal.username+'\'s goal. Follow / Contribute to help (username) achive this goal. ').htmlentities();
    $scope.seo.image = GoalMain.data.goal.cover.large;
    // $scope.seo = {
    //     title: GoalMain.data.goal.user.username + ' goal is to '+ GoalMain.data.goal.name+' ?', 
    //     description: 'Learn more about '+GoalMain.data.goal.username+'\'s goal. Follow / Contribute to help (username) achive this goal. ',
    //     image: GoalMain.data.goal.cover.large
    // }
}]);;LinkagoalWebApp.controller('LinkedGoalPageCtrl', ['$state', '$scope', '$stateParams', '$location', 'GoalMain', 'GoalsDataServices', function($state, $scope, $stateParams, $location, GoalMain, GoalsDataServices) {
    if (GoalMain.data.goal.link + "/linked-goals" != $location.path()) {
        $location.path(GoalMain.data.goal.link + "/linked-goals");
    }

    $scope.pageLoaded = false;
    $scope.$state = $state;

    $scope.loading = {};
    $scope.loading.linkFeeds = true;
    $scope.loading.linkGoals = true;


    GoalsDataServices.getLinkedGoals(GoalMain.data.goal.id).success(function(result) {
        $scope.linkedGoals = result.data.goals;
        $scope.loading.linkGoals = false;
    })

    GoalsDataServices.getLinkedGoalsFeed(GoalMain.data.goal.id).success(function(result) {
        $scope.linkedGoalsFeed = result.data;
        $scope.loading.linkFeeds = false;
    })

    $scope.seo = {};

    $scope.seo.title = ('Goals linked with '+ GoalMain.data.goal.name).htmlentities();
    $scope.seo.description = ('Search for goals similar to '+ GoalMain.data.goal.name).htmlentities();
    $scope.seo.image = GoalMain.data.goal.cover.large;

    // $scope.seo = {
    //     title: 'Goals linked with '+ GoalMain.data.goal.name,
    //     description: 'Search for goals similar to '+ GoalMain.data.goal.name,

    // }
    // GoalsDataServices.getGoal($stateParams.goal_id).success(function(result) {
    //     if ((result.data.goal.link + "/linked-goals") != (window.location.pathname)) {
    //         $location.path(result.data.goal.link + "/linked-goals");
    //         $scope.progressbar.reset();
    //     } else {
    //         $scope.goal = result.data.goal
    //         $scope.progressbar.complete()
    //         $scope.pageLoaded = true;
    //         $scope.isMyGoal = ($scope.goal.user.uid === User.getLoggedInUserId()) ? true : false;
    //     }
    // })

}]);;LinkagoalWebApp.controller('GoalMediaCtrl', ['ExploreServices', '$scope', '$stateParams', '$location', 'GoalsDataServices', 'User', 'ngProgressFactory', '$mdDialog', function(ExploreServices, $scope, $stateParams, $location, GoalsDataServices, User, ngProgressFactory, $mdDialog) {
    // Gallery
    $scope.imgGallery = function(ev) {
        $mdDialog.show({
            templateUrl: 'partials/sub-partials/gallery.tmpl',
            targetEvent: ev,
        })
    }
    $scope.cancel = function() {
            $mdDialog.hide();
        }
        // Gallery
    $scope.pageLoaded = false;
    $scope.progressbar = ngProgressFactory.createInstance();
    $scope.progressbar.setColor('#12bcb5');
    $scope.progressbar.start();

    GoalsDataServices.getGoal($stateParams.goal_id).success(function(result) {
        if ((result.data.goal.link + "/media") != (window.location.pathname)) {
            $location.path(result.data.goal.link + "/media");
            $scope.progressbar.reset();
        } else {
            $scope.goal = result.data.goal
            $scope.progressbar.complete()
            $scope.pageLoaded = true;
            $scope.isMyGoal = ($scope.goal.user.uid === User.getLoggedInUserId()) ? true : false;
        }


        //GoalsDataServices.getGoalMedia($stateParams.goal_id).success(function() {
        //  $scope.linkedGoals = result.data.goals
        //})

    })

}]);;LinkagoalWebApp.controller('VerifyCtrl', ['$scope', '$stateParams', 'UserDataServices', 'User', function($scope, $stateParams, UserDataServices, User) {
    $scope.isLoading = true;
    $scope.success = false;
    UserDataServices.verifyAccount($stateParams.key).success(function(res) {
        $scope.isLoading = false;
        $scope.success = true;
        User.updateLS({ verified: true });
    }).error(function(res) {
        $scope.message = res.meta.message;
        $scope.success = false;
    })
}]);;LinkagoalWebApp.controller('OnBoardingCtrl', function($state, $scope, $rootScope, $location, FileService, UserDataServices, CategoriesServices, User, GoalsDataServices, FindFriends) {

    $scope.selectedImage = false;
    $scope.selectedIndex = $state.current.data.selected;
    $scope.$watch('selectedIndex', function(current, old) {
        $scope.noPrevious = false;
        $scope.noNext = false;

        if ($scope.selectedIndex == 0) { $scope.noPrevious = true; }
        if ($scope.selectedIndex == 6) { $scope.noNext = true; }

        window.scrollTo(0, 0);
        switch (current) {
            case 0:
                $location.url("/welcome");
                $scope.seo = {
                    title: 'Welcome to Linkagoal',
                    robots: 'nofollow, noindex'
                }
                break;
            case 1:
                $location.url("/welcome/about-you");
                //PageMetaData.setTitle("About You");
                break;
            case 2:
                $location.url("/welcome/what-you-like");
                //PageMetaData.setTitle("What You Like");
                break;
            case 3:
                $location.url("/welcome/connect");
                //PageMetaData.setTitle("Connect");
                break;
            case 4:
                $location.url("/welcome/your-goal");
                $scope.seo = {
                    title: "Your Goal",
                    robots: 'nofollow, noindex'
                }

                //PageMetaData.setTitle("Your Goal");
                break;
            case 5:
                $location.url("/welcome/get-inspired");
                //PageMetaData.setTitle("Get Inspired");
                break;
            case 6:
                $location.url("/welcome/whats-changed");
                $scope.seo = {
                        title: "Whats Changed",
                        robots: 'nofollow, noindex'
                    }
                    //PageMetaData.setTitle("Whats Changed");
                break;
        }
    });

    $scope.isLoading = false;
    $scope.loggedInUser = User.me();

    $scope.newUser = User.getWebOnBoardingStatus();

    if ($scope.newUser) {
        $scope.onBoardingSteps = [0, 1, 2, 3, 4, 5, 6];
    } else {
        $scope.onBoardingSteps = [0, 1, 2, 3, 4, 5];
    }

    $scope.previous = function() {
        if ($scope.selectedIndex >= 1) {
            $scope.selectedIndex = ($scope.selectedIndex - 1)
        }
    }
    $scope.next = function() {
        index = $scope.onBoardingSteps.indexOf($scope.selectedIndex);
        if (index >= 0 && index < $scope.onBoardingSteps.length - 1)
            $scope.selectedIndex = $scope.onBoardingSteps[index + 1]

        // if ($scope.selectedIndex <= 6) {
        //     $scope.selectedIndex = ($scope.selectedIndex + 1)
        // }
    }

    if ($scope.selectedIndex == 1) {
        $scope.user = {};
        $scope.user.biography = $scope.loggedInUser.bio;
        $scope.seo = {
            title: "Who is " + $scope.loggedInUser.name,
            robots: 'nofollow, noindex'
        }
        $scope.onChange = function(files) {
            if (files == null) return;
            if (files[0] == undefined) return;
            $scope.profile_image = files[0];
        }
        $scope.profile_image = false;
        $scope.updateProfile = function() {
            var params = {}

            if ($scope.user.location) {
                params.userDefinedLocation = $rootScope.locationAddressFix($scope.user.location);
            }

            if ($scope.user.biography) {
                params.bio = $scope.user.biography;
            } else {
                params.bio = '';
            }

            $scope.isLoading = true;
            if ($scope.profile_image) {
                uid = User.getLoggedInUserId();
                FileService.setType("profile");
                FileService.uploadFile($scope.profile_image).then(function(result) {
                    imageObject = result.data;
                    UserDataServices.updateProfile(User.me().uid, params).success(function(res1) {
                        UserDataServices.changeProfileImage(User.me().uid, { attach_id: imageObject.data.fileId }).success(function(res) {
                            User.updateLS({ image: imageObject.data.file, bio: params.bio })
                            $scope.isLoading = false;
                            $scope.next();
                        })
                    })
                })
            } else {
                if ((params && Object.keys(params).length) > 0) {
                    UserDataServices.updateProfile(User.me().uid, params).success(function() {
                        User.updateLS({ bio: params.bio })
                        $scope.isLoading = false;
                        $scope.next();
                    })
                } else {
                    $scope.next();
                }
            }
        }
    }

    if ($scope.selectedIndex == 2) {

        $scope.selectedInterest = 0;
        $scope.seo = {
            title: "What you Like",
            robots: 'nofollow, noindex'
        }

        $scope.countSeletedInterest = function(tag) {
            $scope.selectedInterest = tag.isMyInterest == 1 ? $scope.selectedInterest + 1 : $scope.selectedInterest;
        }

        $scope.toggleInterest = function(tag) {
            if (tag.isMyInterest == 1) {
                // removing tag
                $scope.selectedInterest = $scope.selectedInterest - 1;
                if ($scope.selectedInterest < 0) $scope.selectedInterest = 0;
                $rootScope.addRemoveInterestTag(tag);
                removeInterest(tag.id);
            } else {
                // adding tag
                $rootScope.addRemoveInterestTag(tag);
                $scope.selectedInterest = $scope.selectedInterest + 1;
                $scope.interestBucketList.push(tag);

            }
        }

        $scope.isAllCategoryLoading = true;
        CategoriesServices.getAllCategoriesWithTags().success(function(result) {
            $scope.categories = result.data;
            $scope.selectedCategory = $scope.categories[0];
            $scope.selectedCategoryId = 0;
            filterMyInterest();
            $scope.isAllCategoryLoading = false;
        });

        $scope.selectCategory = function(i) {
            $scope.selectedCategory = [];
            $scope.selectedCategoryId = i;
            setTimeout(function() {
                $scope.selectedCategory = $scope.categories[i];
            }, 900)

        }

        function filterMyInterest() {
            $scope.interestBucketList = []
            angular.forEach($scope.categories, function(cat, key) {
                angular.forEach(cat.tags, function(tag, key) {
                    if (tag.isMyInterest == 1) {
                        $scope.selectedInterest = $scope.selectedInterest + 1;
                        $scope.interestBucketList.push(tag)
                    }
                });
            });
        }

        function removeInterest(id) {
            angular.forEach($scope.interestBucketList, function(tag, key) {
                if (tag.id == id) $scope.interestBucketList.splice(key, 1);
            });
        }
    }

    if ($scope.selectedIndex == 3) {
        $scope.connectTab = 1;


        UserDataServices.onBoardingDone();
        
        $scope.seo = {
            title: "Connect",
            robots: 'nofollow, noindex'
        }

        $scope.disableLoadMore = false;
        var offset = 0;
        var limit = 10;
        $scope.users = [];

        $scope.loadMoreUsers = function() {
            $scope.isLoadingLinkagoalUsers = true;
            UserDataServices.suggetedUsers({ by:'onboarding', offset: offset, limit: limit }).success(function(result) {
                $scope.isLoadingLinkagoalUsers = false;
                if (result.data.length < limit) $scope.disableLoadMore = true;
                $scope.users = $scope.users.concat(result.data);
                offset = offset + limit;
            });
        }

        $scope.loadMoreUsers();

        $scope.changeConnectTab = function(tab) {
            $scope.connectTab = tab;
        }


        /* fake */
        $scope.fbButtonPressed = false;
        $scope.twButtonPressed = false;
        $scope.facebookFake = function() {

            if ($scope.twButtonPressed) {
                $scope.fbMessage = "Still trying to find F13?";

            } else {
                $scope.fbButtonPressed = true;
                $scope.isLoadingFacebookUsers = true;
                setTimeout(function() {
                    $scope.isLoadingFacebookUsers = false;
                    $scope.fbMessage = "There was an error: press F13 to continue..."
                }, 3000)

                setTimeout(function() {
                    $scope.fbMessageAfter = "Gotcha!, there is no F13 key, this feature is not available in 2nd phase of beta"
                }, 9000)
            }
        }

        $scope.twitterFake = function() {
            if ($scope.fbButtonPressed) {
                $scope.twMessage = "Still trying to find F13?"
            } else {
                $scope.twButtonPressed = true;
                $scope.isLoadingTwitterUsers = true;
                setTimeout(function() {
                    $scope.isLoadingTwitterUsers = false;
                    $scope.twMessage = "There was an error: press F13 to continue..."
                }, 3000)

                setTimeout(function() {
                    $scope.twMessageAfter = "Gotcha!, there is no F13 key, this feature is not available in 2nd phase of beta"
                }, 9000)
            }
        }


        $scope.selected = [];
        $scope.items = [];

        $scope.toggle = function(item, list) {
            if (item.me.isFollowing == true) return false;
            var idx = list.indexOf(item);
            if (idx > -1) {
                list.splice(idx, 1);
            } else {
                list.push(item);
            }
        };

        $scope.exists = function(item, list) {
            return list.indexOf(item) > -1;
        };

        $scope.isChecked = function() {
            return $scope.selected.length === $scope.users.length;
        };

        $scope.toggleAll = function() {
            if ($scope.selected.length === $scope.users.length) {
                $scope.selected = [];
            } else if ($scope.selected.length === 0 || $scope.selected.length > 0) {
                $scope.selected = $scope.users.slice(0);
            }
        };

        $scope.isIndeterminate = function() {
            return ($scope.selected.length !== 0 && $scope.selected.length !== $scope.users.length);
        };

        $scope.isUserFollowLoading = false;
        $scope.followMutipleUsers = function() {
            $scope.isUserFollowLoading = true;
            var selectedIds = [];
            angular.forEach($scope.selected, function(u, key) {
                selectedIds.push(u.uid);
            });

            if (selectedIds.length > 0) {
                FindFriends.followMultiple(selectedIds, 3).success(function(res) {
                    $scope.isUserFollowLoading = false;
                    $scope.next();
                })
            } else {
                $scope.next();
            }
        }

    }

    if ($scope.selectedIndex == 5) {
        $scope.seo = {
            title: "Get Inspired",
            robots: 'nofollow, noindex'
        }

        $scope.disableLoadMore = false;
        var offset = 0;
        var limit = 4;
        $scope.goals = [];
        $scope.loadMoreGoals = function() {
            $scope.isLoadingLinkagoalGoals = true;
            GoalsDataServices.goalFollowSuggestion({ offset: offset, limit: limit }).success(function(result) {
                $scope.isLoadingLinkagoalGoals = false;
                if (result.data.length < limit) $scope.disableLoadMore = true;
                $scope.goals = $scope.goals.concat(result.data);
                offset = offset + limit;
            })
        }

        $scope.loadMoreGoals();
    }

    $scope.finish = function() {
        $location.url("/welcome/get-inspired");
    }

    $rootScope.$on('GOALCREATED', function(event, args) {
        $scope.next();
    });

});
;LinkagoalWebApp.controller('ResourceCenterCtrl', ['$scope', '$location', 'ResourceCenterServices', 'PageMetaData', function($scope, $location, ResourceCenterServices, PageMetaData) {
    $scope.isLoading = true;
    PageMetaData.setTitle('Resource-Centre')
    ResourceCenterServices.get().success(function(res) {
        $scope.isLoading = false;
        $scope.articles = res.data
    })
}]);
;LinkagoalWebApp.controller('ResourceCenterArticleCtrl', ['$scope', '$stateParams', 'ResourceCenterServices', 'PageMetaData', function($scope, $stateParams, ResourceCenterServices, PageMetaData) {
    $scope.isLoading = true;
    ResourceCenterServices.getArticle($stateParams.id).success(function(res) {
        $scope.isLoading = false;
        $scope.article = res.data[0]
        PageMetaData.setTitle(res.data[0].title)
        //Add meta description
    })
}]);;LinkagoalWebApp.controller('myCtrl', Ctrl);

function Ctrl(defaultValues, $window) {
    var vm = this;

    vm.positions = defaultValues.positions;
    vm.effects = defaultValues.effects;
    vm.methods = defaultValues.methods;
    vm.actions = defaultValues.actions;

    vm.menuState = 'closed';
    vm.loc = loc;
    vm.setMainAction = setMainAction;
    vm.mainAction = mainAction;

    vm.chosen = {
        effect: 'zoomin',
        position: 'br',
        method: 'click',
        action: 'fire'
    };

    vm.buttons = [{
        label: 'Achieve',
        icon: 'lg-icon-plus',
        href: '#'
    }, {
        label: 'Share',
        icon: 'lg-icon-share',
        href: '#'
    }, {
        label: 'Edit',
        icon: 'lg-icon-edit',
        href: '#'
    }];

    function loc(href) {
        $window.location.href = href;
    }

    function mainAction() {
        //console.log('Firing Main Action!');
    }

    function setMainAction() {
        if (vm.chosen.action === 'fire') {
            vm.mainAction = mainAction;
        } else {
            vm.mainAction = null;
        }
    }
}

Ctrl.prototype.hovered = function() {
    // toggle something on hover.
};

Ctrl.prototype.toggle = function() {
    this.menuState = this.menuState === 'closed' ? 'open' : 'closed';
};

Ctrl.prototype.closeMenu = function() {
    this.menuState = 'closed';
};

Ctrl.$inject = ['defaultValues', '$window'];;LinkagoalWebApp.controller('HeadTagCtrl', ['$scope', 'PageMetaData', function($scope, PageMetaData) {
    $scope.Page = PageMetaData;
}]);;LinkagoalWebApp.controller('AppCtrl', function($scope, $rootScope, $mdDialog, $interval, $mdUtil, CoachMarksDataServices) {

    if ($rootScope.isLoggedIn() == true) {
        CoachMarksDataServices.get().success(function(result) {
            var resVal = Array();
            angular.forEach(result.data, function(value, key) {
                resVal[value.type] = value;
            });
            $rootScope.coachMarks = resVal;
        });
    } else {
        $rootScope.coachMarks = [];
    }


    $scope.alert = '';

    $scope.achieveGoal = function(ev) {
        $mdDialog.show({
            controller: DialogController,
            templateUrl: 'partials/sub-partials/goal-modal-achieve.tmpl',
            targetEvent: ev,
        })
    };
    $scope.achievedGoal = function(ev) {
        $mdDialog.show({
            controller: DialogController,
            templateUrl: 'partials/sub-partials/goal-modal-achieved.tmpl',
            targetEvent: ev,
        })
    };
    $scope.shareGoal = function(ev) {
        $mdDialog.show({
            controller: DialogController,
            templateUrl: 'partials/sub-partials/goal-modal-share.tmpl',
            targetEvent: ev,
        })
    };
    $scope.followProfile = function(ev) {
        $mdDialog.show({
            controller: DialogController,
            templateUrl: 'partials/sub-partials/profile-modal.tmpl',
            targetEvent: ev,
        })
    };
    $scope.milestoneComplete = function(ev) {
        $mdDialog.show({
            controller: DialogController,
            templateUrl: 'partials/sub-partials/milestone-com-modal.tmpl',
            targetEvent: ev,
        })
    };


    //popover 
    $scope.items = [{ name: "Action" }];

    //ngToggle
    $scope.settingDrp = true;
    $scope.notifyDrp = true;
    $scope.messageDrp = true;


    //idk
    $scope.modes = 'query';
    $scope.determinateValue = 30;
    $interval(function() {
        $scope.determinateValue += 1;
        if ($scope.determinateValue > 100) {
            $scope.determinateValue = 30;
        }
    }, 100, 0, true);


    //mdtoogle

    $scope.toggleLeft = buildToggler('left');
    $scope.toggleRight = buildToggler('right');
    /**
     * Build handler to open/close a SideNav; when animation finishes
     * report completion in console
     */
    function buildToggler(navID) {
        var debounceFn = $mdUtil.debounce(function() {
            $mdSidenav(navID)
                .toggle()
                .then(function() {
                    $log.debug("toggle " + navID + " is done");
                });
        }, 300);
        return debounceFn;
    }
});;function DialogController($scope, $mdDialog) {
    $scope.hide = function() {
        $mdDialog.hide();
    };
    $scope.cancel = function() {
        $mdDialog.cancel();
    };
    $scope.answer = function(answer) {
        $mdDialog.hide(answer);
    };

    $scope.goal = {};
    $scope.readonly = false;
    $scope.tags = [];
};function CreateGoalCtrl($scope, $mdDialog, GoalsDataServices, FileService, Post, predata) {
    $scope.cancel = function() {
        $mdDialog.hide();
    };

    $scope.preData = predata;
};LinkagoalWebApp.controller('VideoCtrl', ["$sce", function($sce) {
    this.config = {
        sources: [
            { src: $sce.trustAsResourceUrl("http://107.170.197.65/linkagoal_x264.mp4"), type: "video/mp4" },
        ],
        plugins: {
            poster: "assets/media/img/video-placeholder.jpg"
        }
    };
}]);;LinkagoalWebApp.controller('LeaderboardCtrl', [function() {

}]);;LinkagoalWebApp.controller('GoalMainCtrl', ['$scope', 'GoalMain', 'User', '$location', '$stateParams', '$mdDialog', function($scope, GoalMain, User, $location, $stateParams, $mdDialog) {

    $scope.goal = GoalMain.data.goal
    $scope.isMyGoal = ($scope.goal.user.uid === User.getLoggedInUserId()) ? true : false;

    if ($scope.goal.end_date == null) {
        $scope.daysToExpire = dateDiffInDays(new Date($scope.goal.start_date), new Date());
    } else {
        $scope.daysToExpire = dateDiffInDays(new Date($scope.goal.start_date), new Date($scope.goal.end_date));
    }

    var _MS_PER_DAY = 1000 * 60 * 60 * 24;

    function dateDiffInDays(a, b) {
        var diff = (a.getTime() - b.getTime())
        if (diff < 1) {
            return -1;
        } else {
            return Math.round(Math.abs((a.getTime() - b.getTime()) / (_MS_PER_DAY)));
        }
    }

    $scope.achieveGoal = function(goal, ev) {
        if (goal.status == 'COMPLETED') return false;

        $mdDialog.show({
            locals: { goal: goal },
            controller: ['$scope', 'GoalsDataServices', 'goal', function($scope, GoalsDataServices, goal) {
                $scope.goal = goal;
                $scope.cancel = function() {
                    $mdDialog.hide();
                }
                $scope.isLoading = false;
                $scope.acheiveNow = function(id) {
                    $scope.isLoading = true;
                    params = { text: $scope.text }
                    GoalsDataServices.achieve(id, params).then(function(result) {
                        goal.status = "COMPLETED";
                        $scope.isLoading = false;
                        $mdDialog.hide();
                    })
                }
            }],
            templateUrl: 'partials/sub-partials/goal-modal-achieved.tmpl',
            targetEvent: ev,
        })
    }

    $scope.seo = {};

    $scope.seo.title = ($scope.goal.user.name + " - @" +  $scope.goal.user.username + ' goal is to '+ $scope.goal.name).htmlentities();
    $scope.seo.description = ('Learn more about goal. Follow / Contribute on '+$scope.goal.user.name+' goal to help achive this goal. ').htmlentities();
    $scope.seo.image = $scope.goal.cover.large;

    // $scope.seo = {
    //     title: $scope.goal.user.username + ' goal is to '+ $scope.goal.name+' ?', 
    //     description: 'Learn more about '+$scope.goal.username+'\'s goal. Follow / Contribute to help (username) achive this goal. ',
    //     image: $scope.goal.cover.large
    // }
}]);
;LinkagoalWebApp.controller('ContributionsCtrl', [function() {

}]);;LinkagoalWebApp.controller('FollowingCtrl', [function() {

}]);;LinkagoalWebApp.controller('FollowersCtrl', [function() {

}]);;LinkagoalWebApp.controller('ProfileBadgesCtrl', [function() {

}]);;LinkagoalWebApp.controller('BookmarkGoalCtrl', [function() {

}]);;LinkagoalWebApp.controller('ImgLightBoxCtrl', [function() {

}]);;LinkagoalWebApp.controller('GoalContributionCtrl', ['$scope', '$rootScope', 'GoalMain', 'GoalsDataServices', 'FileService', function($scope, $rootScope, GoalMain, GoalsDataServices, FileService) {

    $scope.loading = {}
    $scope.loading.contribution = true;
    $scope.loading.feeds = true;
    $scope.contributions = []

    $scope.disableLoadMore = false;
    var newoffset = 0;
    var newlimit = 5;
    $scope.contribution = function(id, i) {
        if ($scope.activities[i].newcomment.length > 0) {
            params = { comment_txt: $scope.activities[i].newcomment, comment_type: "TEXT" }
            CommentDataServices.comment(id, params).success(function(result) {
                $scope.activities[i].newcomment = "";
                $scope.activities[i].post.comments.push(result.data);
            });
        }
    }

    $scope.loadContributions = function() {
        $scope.isloadMoreContributions = true;
        GoalsDataServices.getContribuitons(GoalMain.data.goal.id, { offset: newoffset, limit: newlimit }).success(function(result) {
            $scope.isloadMoreContributions = false;
            if (result.data.length < newlimit) $scope.disableLoadMore = true;
            $scope.contributions = $scope.contributions.concat(result.data);
            newoffset = newoffset + newlimit;
        })
    }
    $scope.loadContributions()
        /* New Contribution */
    $scope.postingContribution = false;
    $scope.newContribution = {}
    $scope.newContribution.text = '';
    $scope.newContribution.file = false;
    $scope.newContribution.processing = false;
    $scope.newContribution.crawledUrl = {}

    $scope.newContribution.onChange = function(files, newContribution) {
        if (files == null || files[0] == undefined) return;
        newContribution.fileAttached = true;
        FileService.setType("post");
        FileService.uploadFile(files[0]).then(function(result) {
            newContribution.file = result.data.data;
        })
    }

    $scope.newContribution.fetchedURLs = [];

    $scope.postContribution = function(gid) {
        if ($scope.newContribution.text.length > 0 || ($scope.newContribution.fileAttached)) {
            var params = { text: $scope.newContribution.text }
            if ($scope.newContribution.file != null) {
                params.attach_id = $scope.newContribution.file.fileId;
            }

            if ($scope.newContribution.crawledUrl.fetched_url_id != null) {
                params.fetched_url_id = $scope.newContribution.crawledUrl.fetched_url_id;
            }

            $scope.newContribution.processing = true;
            GoalsDataServices.postContribution(gid, params).success(function(result) {
                $scope.newContribution.fileAttached = false;
                $scope.newContribution.file = false;
                $scope.newContribution.processing = false
                $scope.newContribution.text = "";
                $scope.contributions.unshift(result.data);
                $scope.newContribution.crawledUrl.remove();
            });
        }
    }

    $rootScope.$on('event.delete.post', function(event, args) {
        if (args.event == 'CONTRIBUTION') {
            $scope.contributions.splice(args.index, 1);
        }
    });
}])
;LinkagoalWebApp.controller('GoalLikesCtrl', [function() {

}]);;LinkagoalWebApp.controller('GoalAchieveCtrl', [function() {

}]);;LinkagoalWebApp.controller('GoalLinkersCtrl', [function() {

}]);;LinkagoalWebApp.controller('LoginSignupCtrl', function($scope, $state, index, $mdDialog) {

    $scope.closeModal = function() {
        $mdDialog.cancel();
    };

    $scope.changeIndex = function(index) {
        $scope.selectedIndex = index;
    }

    $scope.forgot = function() {
        $scope.closeModal();
        $state.go('app.forgot')
    }

    $scope.changeIndex(index);
});
;LinkagoalWebApp.value('defaultValues', {
    positions: [{
        name: 'Position'
    }, {
        value: 'tl',
        name: 'Top left'
    }, {
        value: 'tr',
        name: 'Top right'
    }, {
        value: 'br',
        name: 'Bottom right'
    }, {
        value: 'bl',
        name: 'Bottom left'
    }],

    effects: [{
        name: 'Effect'
    }, {
        value: 'slidein',
        name: 'Slide in + fade'
    }, {
        value: 'zoomin',
        name: 'Zoom in'
    }, {
        value: 'fountain',
        name: 'Fountain'
    }, {
        value: 'slidein-spring',
        name: 'Slidein (spring)'
    }],

    methods: [{
        name: 'Method'
    }, {
        value: 'click',
        name: 'Click'
    }, {
        value: 'hover',
        name: 'Hover'
    }],
    actions: [{
        name: 'Fire Main Action?'
    }, {
        value: 'fire',
        name: 'Fire'
    }, {
        value: 'nofire',
        name: 'Don\'t Fire'
    }]
});;LinkagoalWebApp.directive('goalBox', function() {
    return {
        restrict: 'AE',
        scope: {
            goalData: '=resultSet',
            flex: '=flex'
        },
        controller: function($scope) {
            //$scope.goalData = []
        },
        templateUrl: 'partials/sub-partials/_goal_box.tmpl'
    };
});


LinkagoalWebApp.directive('videoPlayer', ['$compile', function ($compile) {
    return {
        restrict: 'E',
        scope : {
            url:'=url',
            provider: '=provider'
        },
        replace: true,
        link: function (scope, element, attrs) {
            var template;
            scope.url = scope.url.replace(/^https?\:/i, "");
            scope.url = scope.url.replace(/^http?\:/i, "");
            scope.url = scope.url + '&iv_load_policy=1';
            var htmlText = '<video class="video-js vjs-default-skin" controls width="640" height="264" data-setup=\'{"techOrder":["'+scope.provider+'"],"sources":[{"type":"video/'+scope.provider+'","src":"'+scope.url+'"}]}\'></video>';
            template = angular.element($compile(htmlText)(scope));
            element.replaceWith(template);
        }
    }
}]);LinkagoalWebApp.directive('contenteditable', ['$sce', function($sce) {
    return {
        restrict: 'A', // only activate on element attribute
        require: '?ngModel', // get a hold of NgModelController
        link: function(scope, element, attrs, ngModel) {
            function read() {
                var html = element.html();
                // When we clear the content editable the browser leaves a <br> behind
                // If strip-br attribute is provided then we strip this out
                if (attrs.stripBr && html === '<br>') {
                    html = '';
                }
                ngModel.$setViewValue(html);
            }

            if (!ngModel) return; // do nothing if no ng-model

            // Specify how UI should be updated
            ngModel.$render = function() {
                if (ngModel.$viewValue !== element.html()) {
                    element.html($sce.getTrustedHtml(ngModel.$viewValue || ''));
                }
            };

            // Listen for change events to enable binding
            element.on('blur keyup change', function() {
                scope.$apply(read);
            });
            read(); // initialize
        }
    };
}]);LinkagoalWebApp.directive('pageGuide', function($rootScope, pageGuideLS) {
    return {
        restrict: 'AE',
        scope: {
            page: '@page',
            title: '@title',
            image: '@image',
        },
        templateUrl: 'partials/sub-partials/page_guide.html',
        link: function(scope, element) {
            scope.isPageShowable = !pageGuideLS.get(scope.page);

            if (scope.isPageShowable) {
                $rootScope.$broadcast("custom-model:open")
            }

            scope.close = function() {
                pageGuideLS.set(scope.page)
                $rootScope.$broadcast("custom-model:close")
                $(element).remove();
            }
        }
    };
});;LinkagoalWebApp.directive('showMore', function($compile, CommentDataServices) {
    return {
        restrict: 'AE',
        scope: {
            post: '=activity',
            isLoading: '=isloading'
        },
        link: function(scope, element, attr) {
            var offset = scope.post.comments.length;
            var limit = 5;

            scope.isLoading = false;
            element.bind("click", function() {
                scope.isLoading = true;
                CommentDataServices.getAll(scope.post.id, { offset: offset, limit: limit }).success(function(result) {
                    if (Object.keys(result.data).length < limit) {
                        element.parent().remove()
                    }
                    scope.post.comments = result.data.concat(scope.post.comments);
                    offset = offset + limit;
                    scope.isLoading = false;
                });
            })
        }
    }
});;LinkagoalWebApp.directive('readMore', function($compile, $rootScope) {
    var template = '<div class="lg-white-overlay" style="overflow:auto;"><div ng-esc></div>' +
        '<div><button ng-click="close()" class="lg-simple-btn mts"><i class="lg-icon-cross-small mls lg-vm-align round-btn"></i></button></div>' +
        '<div class="lg-relative">' +
        '<div class="lg-l-align pal ft-16 lg-white-overlay-content">{{text}}</div>' +
        '</div>' +
        '</div>';

    return {
        restrict: 'A',
        scope: {
            text: '=text'
        },
        link: function(scope, element, attrs) {
            element.bind("click", function() {
                $rootScope.$broadcast("custom-model:open")
                var content = $compile(template)(scope);
                $('body').append(content);
            })

            scope.close = function() {
                $rootScope.$broadcast("custom-model:close")
                $('.lg-white-overlay').remove();
            }

            scope.keyPressed = function(e) {
                if (e.which == 27 || e.which == 13) {
                    scope.close()
                }
            };
        }
    }
});LinkagoalWebApp.directive('locationBox', function($http) {
    var geocode = "'geocode'";
    return {
        scope: {
            vm: '=vm',
            selected: '=selected'
        },
        restrict: 'AE',
        template: '  <md-autocomplete md-no-cache="true" ng-init="vm.searchText = selected" md-selected-item="vm.selectedItem" ng-model-options="{debounce: 300}" md-search-text-change="vm.search(vm.searchText)" md-search-text="vm.searchText" md-items="item in vm.search(vm.searchText)" md-item-text="item.formatted_address" md-min-length="0" placeholder="Type your address">' +
            '<md-item-template>' +
            '<span md-highlight-text="vm.searchText.formatted_address" md-highlight-flags="^i">{{item.formatted_address}}</span>' +
            '</md-item-template>' +
            '</md-autocomplete>',
        controller: ['$scope', '$q', function($scope, $q) {
            setTimeout(function() {
                //console.log($scope.selected)
            },4000)
            $scope.vm = {};
            $scope.vm.search = function(address) {
                if (address == null || address == "") return false;
                var deferred = $q.defer();
                getResults(address).then(function(predictions) {
                    var results = [];
                    for (var i = 0, prediction; prediction = predictions[i]; i++) {
                        results.push(prediction);
                    }
                    deferred.resolve(results);
                });

                return deferred.promise;
            }

            function getResults(address) {
                var deferred = $q.defer();

                $http.get('https://maps.googleapis.com/maps/api/geocode/json', {
                    params: {
                        address: address,
                        sensor: false
                    }
                }).success(function(res) {
                    deferred.resolve(res.results);
                })

                return deferred.promise;
            }

        }]
    };


});;LinkagoalWebApp.directive('goalListBox', function() {
    return {
        restrict: 'AE',
        scope: {
            goals: '=resultSet',
            followBtnShow: '=followBtnShow',
            linkBtnShow: '=linkBtnShow',
            isViewOnly:'=isViewOnly'
        },
        controller: function($scope, $element, $attrs, $transclude) {},
        templateUrl: 'partials/sub-partials/goal-box-list.html'
    };
});;LinkagoalWebApp.directive('lightBox', function($templateRequest, $compile, $rootScope, Post, FeedServices, $location) {
    // Runs during compile
    return {
        // name: '',
        // priority: 1,
        // terminal: true,
        scope: {
            modalData: '=modalData',
            i: '=in',
            single: '=single'
        }, // {} = isolate, true = child, false/undefined = no change
        // controller: function($scope, $element, $attrs, $transclude) {},
        // require: 'ngModel', // Array = multiple requires, ? = optional, ^ = check parent elements
        restrict: 'A', // E = Element, A = Attribute, C = Class, M = Comment
        // template: '',
        // templateUrl: '',
        // replace: true,
        // transclude: true,
        // compile: function(tElement, tAttrs, function transclude(function(scope, cloneLinkingFn){ return function linking(scope, elm, attrs){}})),
        link: function(scope, element, iAttrs, controller) {
 
            element.bind("click", function() {

                $templateRequest("partials/img-lightbox.html").then(function(html) {
                    var template = angular.element(html);
                    angular.element("body").append(template);
                    $compile(template)(scope);
                });
                $rootScope.$broadcast("custom-model:open")
                scope.isLoading = true;

                var single = scope.single || false;

                if (single) {
                    id = scope.modalData.id;
                    scope.data = {post:scope.modalData};
                    scope.isLoading = false;
                    scope.image = scope.modalData.media.files[0].source.large.src
                } else {
                    scope.isLoading = true;
                    FeedServices.getAlbum(scope.modalData.media.info.album_id).success(function(res) {
                        scope.nowAblum = res.album.files;
                        //scope.postID = scope.nowAblum[scope.i].postId;
                        //getPost(scope.postID);
                        scope.image = scope.nowAblum[scope.i].source.medium.src;
                        hidePrevBtn();
                        hideForward();
                    })

                }


            })

            function getPost(id) {
                Post.get(id).success(function(res) {
                    scope.data = res.data;
                    scope.isLoading = false;
                });


            }

            scope.close = function() {
                //scope.i=currentState;
                //scope.image = scope.nowAblum[scope.i].source.medium.src;
                scope.nowAblum = [];
                scope.postID = null;
                scope.i = null;

                $rootScope.$broadcast("custom-model:close");
                $(".lg-lightbox-open").remove();
            }

            function hidePrevBtn() {
                if (0 == scope.i) { scope.showPrevBtn = false; } else { scope.showPrevBtn = true; }
            }

            scope.prev = function() {
                scope.i = scope.i - 1;
                scope.postID = scope.nowAblum[scope.i].postId;
                getPost(scope.postID);
                scope.image = scope.nowAblum[scope.i].source.medium.src
                hidePrevBtn();
                scope.showFwdBtn = true;
            }

            function hideForward() {
                if ((scope.nowAblum.length - 1) == scope.i) { scope.showFwdBtn = false; } else { scope.showFwdBtn = true; }
            }

            scope.next = function() {
                scope.i = scope.i + 1;
                scope.postID = scope.nowAblum[scope.i].postId;
                getPost(scope.postID);
                scope.image = scope.nowAblum[scope.i].source.medium.src
                hideForward();
                scope.showPrevBtn = true;
            }


        }
    };
});;;LinkagoalWebApp.directive('myGoalBox', function() {
    return {
        restrict: 'E',
        scope: {
            goalData: '=resultSet',
            flex: '=flex'
        },
        controller: function($scope) {
            //$scope.goalData = []
        },
        templateUrl: 'partials/sub-partials/_my_goal_box.tmpl'
    };
});;LinkagoalWebApp.directive('activityFeeds', function() {
    return {
        restrict: 'A',
        scope: {
            activities: '=resultSet',
            goalPage: '=goalPage',
            disableLink: '=disableLink'
        },
        templateUrl: 'partials/sub-partials/_activity_feeds.html'
    };
});;LinkagoalWebApp.directive('profileBox', function() {
    return {
        restrict: 'E',
        scope: {
            profileData: '=resultSet',
            flex: '=flex'
        },
        templateUrl: 'partials/sub-partials/_profile_module.tmpl'
    };
});;LinkagoalWebApp.directive('emptydata', function() {
    return {
        restrict: 'E',
        scope: {
            profileData: '=resultSet',
            flex: '=flex'
        },
        templateUrl: function($elem, $attr) {
            if ($attr.type == "my-goals") {
                return 'partials/sub-partials/_emptydata_left.tmpl';
            } else if ($attr.type == "no-goals") {
                return 'partials/sub-partials/_emptydata_left.tmpl';
            }
        },
        controller: ['$scope', function($scope) {
            $scope.createGoalBtn = function() {
                angular.element("#create-goal-input").focus();
            };
        }]
    };
});;LinkagoalWebApp.directive('emptydataRight', function() {
    return {
        restrict: 'E',
        scope: {
            profileData: '=resultSet',
            flex: '=flex'
        },
        templateUrl: 'partials/sub-partials/_emptydata_right.tmpl'
    };
});;LinkagoalWebApp.directive('notfoundpage', function() {
    return {
        restrict: 'AEC',
        templateUrl: 'partials/static/404.html'
    };
});;LinkagoalWebApp.directive("dropdown", function($document) {
        return function(scope, element, attrs) {
            element.bind("click", function() {
                var DropDownElement = element.find('.dropdown');
                if (DropDownElement.hasClass("lg-view")) {
                    DropDownElement.removeClass("lg-view");
                } else {
                    DropDownElement.addClass("lg-view");
                }
            })
        }
});LinkagoalWebApp.directive('profileBanner', function() {
    return {
        restrict: 'E',
        scope: {
            profile: '=resultSet'
        },
        templateUrl: 'partials/sub-partials/_profile_banner.tmpl',
        controller: ['$scope', '$rootScope', '$location', '$filter', '$mdDialog', '$timeout', 'Cropper', 'FileService', 'UserDataServices', 'ngProgressFactory', 'User', function($scope, $rootScope, $location, $filter, $mdDialog, $timeout, Cropper, FileService, UserDataServices, ngProgressFactory, User) {
            $scope.moduleChatExists = modules.indexOf('app.chat') < 0 ? false : true;
            $scope.showmessage = true;
            $scope.minimizeWindow = true;

            try {
                $rootScope.chatFactory.onChat = false;
            } catch(e) {}
            
            $scope.showMessage = function(user) {
                $rootScope.chatFactory.chatOnProfile(user.uid);
                // for (var i=0; i<$scope.chat.mainObj.user.length ; i++) {
                //     if (user.uid == $scope.chat.mainObj.user[i].user.uid) {
                //         var convesation_id = $scope.chat.mainObj.user[i].key;
                //         var index = $scope.chat.mainObj.user[i].index;
                //     }
                // }
                $scope.showmessage = false;
                // //$scope.chat.chat(convesation_id, index)
                // console.log($scope.chat)
                // console.log($scope.chat.mainObj.chatSpecific.convesation_id)
            }

            $scope.hideMessage = function() {
                $scope.showmessage = true;
            }

            $scope.minimize = function() {
                if ($scope.minimizeWindow == false) {
                    $scope.minimizeWindow = true;
                } else {
                    $scope.minimizeWindow = false;
                }
            }
            $scope.showMuteConfirm = function(user, ev) {
                $mdDialog.show({ templateUrl: 'partials/sub-partials/deleteConfirm.tmpl', controller: MuteDialogController, targetEvent: ev, locals: { user: user }, clickOutsideToClose: true, parent: angular.element(document.body) })
            }

            $scope.showReportConfirm = function(id, ev) {
                var title = "Would you like to report?",
                    content = "",
                    ok = "Report";
                showConfirm(title, content, ok, ev);
            };

            $scope.showBlockConfirm = function(user, ev) {
                $mdDialog.show({ templateUrl: 'partials/sub-partials/deleteConfirm.tmpl', controller: BlockDialogController, targetEvent: ev, locals: { profile: $scope.profile, user: user }, clickOutsideToClose: true, parent: angular.element(document.body) })
            };

            function showConfirm(title, content, ok, ev) {
                var confirm = $mdDialog.confirm().title(title).content(content).targetEvent(ev).ok(ok).cancel('Cancel');
                $mdDialog.show(confirm).then(function() {
                    return true
                }, function() {
                    return false;
                });
            };

            function BlockDialogController($mdDialog, $scope, profile, user) {
                $scope.title = "Would you like to block?";
                $scope.content = 'Profile ' + profile.name + ' will no longer be able to follow you, or message you and all your previous acivities will no longer be visible to them'
                $scope.ok = "Block";
                $scope.innerHtml = '<div class="ft-14 mtm">' +
                    '<div>To Unblock this profile go to:</div>' +
                    '<div>Settings Page > Accounts tab > Block Users</div>' +
                    '</div>';
                $scope.cancel = function() {
                    $mdDialog.cancel();
                }
                $scope.confirm = function() {
                    $scope.isLoading = true;
                    UserDataServices.blockUser(user.uid).success(function(res) {
                        $rootScope.Notify.UImessage("Successfully Blocked", "success", "right", 'top');
                        $location.url('/')
                        $mdDialog.cancel();
                        $scope.isLoading = false;
                    })
                }
            }

            function MuteDialogController($mdDialog, $scope, user) {
                $scope.title = "Would you like to mute?";
                $scope.content = 'You will no longer receive notifications from this ' + user.name;
                $scope.ok = user.me.isMuted == 0 ? "Mute" : "Unmute";
                $scope.cancel = function() {
                    $mdDialog.cancel();
                }
                $scope.confirm = function() {
                    $scope.isLoading = true;

                    if (user.me.isMuted == 0) {
                        UserDataServices.muteUser(user.uid).success(function(res) {
                            user.me.isMuted = 1;
                            $rootScope.Notify.UImessage("Successfully muted", "success", "right", 'top');
                            $mdDialog.cancel();
                            $scope.isLoading = false;
                        })
                    } else {
                        UserDataServices.unMuteUser(user.uid).success(function(res) {
                            user.me.isMuted = 0;
                            $rootScope.Notify.UImessage("Successfully un-muted", "success", "right", 'top');
                            $mdDialog.cancel();
                            $scope.isLoading = false;
                        })
                    }
                }
            }

            $scope.profileCoverModal = function(ev) {
                $mdDialog.show({
                    controller: ['$scope', function($scope) {
                        $scope.cancel = function() {
                            $mdDialog.hide();
                        }
                        $scope.imageType = "cover";
                        $scope.aspectRatio = 49 / 17;
                        $scope.firstTabName = "Upload Cover Image";
                        //$scope.secondTabName = "Suggested Cover Image";

                        UserDataServices.suggestedCoverImages().success(function(res) {
                            $scope.suggestedImages = res.data
                        })

                        $scope.$on('ev_imageCropperSave', function(event, args) {
                            params = { attach_id: args.data.fileId }
                            uid = User.getLoggedInUserId();
                            UserDataServices.changeProfileCover(uid, params).success(function() {
                                $scope.imageProcessingLoader = false;
                                $rootScope.$broadcast('coverImageChanged', { data: args.data.file });
                                $mdDialog.hide();
                            })
                        });

                    }],
                    templateUrl: 'partials/sub-partials/imageupload-modal.html',
                    targetEvent: ev,
                })
            }

            $scope.profilePictureModal = function(ev) {
                $mdDialog.show({
                    controller: ['$scope', function($scope) {
                        $scope.cancel = function() {
                            $mdDialog.hide();
                        }
                        $scope.imageType = "profile";
                        $scope.aspectRatio = 1 / 1;
                        $scope.firstTabName = "Upload Pofile Image";
                        //$scope.secondTabName = "Avatars";

                        UserDataServices.suggestedProfileImages().success(function(res) {
                            $scope.suggestedImages = res.data
                        })

                        $scope.imageSelectedId = 0
                        $scope.selectSuggestImage = function(i) {
                            $scope.imageSelectedId = $scope.suggestedImages.images[i].fileId;
                            $scope.imageSelectedTemp = $scope.suggestedImages.images[i];
                        }

                        $scope.setProfileImage = function() {
                            params = { profile_image_id: $scope.imageSelectedId }
                            uid = User.getLoggedInUserId();
                            UserDataServices.changeProfileImage(uid, params).success(function(res) {
                                $rootScope.$broadcast('profileImageChanged', { data: $scope.imageSelectedTemp });
                                $scope.$parent.cancel();
                            })
                        }


                        $scope.$on('ev_imageCropperSave', function(event, args) {
                            params = { attach_id: args.data.fileId }
                            uid = User.getLoggedInUserId();
                            UserDataServices.changeProfileImage(uid, params).success(function() {
                                $scope.imageProcessingLoader = false;
                                $rootScope.$broadcast('profileImageChanged', { data: args.data.file });
                                $mdDialog.hide();
                            })
                        });

                    }],
                    templateUrl: 'partials/sub-partials/imageupload-modal.html',
                    targetEvent: ev,
                })
            }
        }]
    };
});
;LinkagoalWebApp.directive('goalMoreOptions', function($mdDialog, GoalsDataServices, $rootScope, $location){
    return {
        // scope: {}, // {} = isolate, true = child, false/undefined = no change
        restrict: 'A', // E = Element, A = Attribute, C = Class, M = Comment
        link: function($scope, $elem, $attr) {
            $scope.showEditConfirm = function(goal, ev) {
                $mdDialog.show({templateUrl: 'partials/sub-partials/goal-modal-edit.tmpl', controller: EditGoalCtrl,targetEvent: ev, locals: {goal : goal, action: 'edit'}, clickOutsideToClose:true, parent: angular.element(document.body)})
            }

            $scope.showMuteConfirm = function(goal, ev) {
                $mdDialog.show({templateUrl: 'partials/sub-partials/deleteConfirm.tmpl', controller: DialogController,targetEvent: ev, locals: {goal : goal, action: 'mute'}, clickOutsideToClose:true, parent: angular.element(document.body)})
            }

            $scope.showDeleteConfirm = function(goal, ev) {
                //console.log(goal);
                $mdDialog.show({templateUrl: 'partials/sub-partials/deleteConfirm.tmpl', controller: DialogController,targetEvent: ev, locals: {goal : goal, action: 'delete'}, clickOutsideToClose:true, parent: angular.element(document.body)})
            }

            function EditGoalCtrl($scope, goal, action, $mdConstant) {
                $scope.close = function() {
                    $mdDialog.cancel();
                } 

                $scope.regex = /(?:^|\s)\s*(#[A-Za-z][A-Za-z0-9-_]+)/;

                $scope.keys = [$mdConstant.KEY_CODE.ENTER, $mdConstant.KEY_CODE.COMMA, $mdConstant.KEY_CODE.SPACE ];

                $scope.tags = []
                for (var i =0; i<goal.tags.length ; i++) {
                    $scope.tags.push(goal.tags[i]);
                }
                //$scope.tags = goal.tags
                $scope.loadCategories = function() {
                    $scope.categories = $rootScope.goalCategories;
                }
                $scope.loadCategories();
                //$scope.privacyScope = $rootScope.privacyOptions;
                $scope.goal = {
                    goal_name: goal.name,
                    goal_description: goal.description,
                    category_id: goal.category_id || 1,
                    scope_id: goal.scope_id
                }

                $scope.newHash = function(chip) {
                    var patt = new RegExp('([A-Za-z0-9_]+)');
                    var a = patt.exec(chip)
                    if (a != null) {
                        if (a != '') { return { name:a[0] } }
                    } else {
                        return null;
                    }
                }

                $scope.save = function() {
                    $scope.isLoading = true;
                    var tags = []
                    for (var i=0;i<$scope.tags.length; i++) {
                        tags.push('#'+$scope.tags[i].name);                        
                    }
                    $scope.goal.tags = tags.toString();

                    //console.log($scope.goal)
                    GoalsDataServices.updateGoal(goal.id,$scope.goal).success(function(res) {
                        goal.name = $scope.goal.goal_name;
                        goal.description = $scope.goal.goal_description;
                        goal.tags = $scope.tags;
                        //console.log(goal);
                        $scope.isLoading = false;

                        $mdDialog.cancel();
                        $location.path(res.data.link)
                    })
                    .error(function(err) {
                        //console.log("error");
                    })
                }
            };



            function DialogController($scope, goal, action) {
                $scope.cancel = function() {
                    $mdDialog.cancel();
                }
                if (action == 'delete') {
                    $scope.title = "Are you sure you want to delete this goal?";

                    $scope.innerHtml = '<div>'+
                                            '<div>Linkers: ' + goal.stats.linkers + '</div>'+
                                            '<div>Followers: ' + goal.stats.followers + '</div>'+
                                            '<div>Motivations: ' + goal.stats.motivations + '</div>'+
                                            '<div>Contributions: ' + goal.stats.contribution + '</div>'+
                                        '</div>';
                    $scope.ok = 'Delete';
                    $scope.confirm = function() {
                        $scope.isLoading = true;
                        GoalsDataServices.deletGoal(goal.id).success(function(res) {
                                $rootScope.Notify.UImessage("Successfully Deleted", "success", "right", 'top');
                                $mdDialog.cancel();
                                $location.url('/'+goal.user.username);
                                $scope.isLoading = false;                      
                        })
                    }
                }
                else if (action == 'mute') {
                    $scope.title = "Would you like to mute?";
                    $scope.content = 'You will no longer receive notifications from this goal'
                    if (goal.me.isMuted == 0) {
                        $scope.ok = "Mute";
                    } else {
                        $scope.ok = "Unmute";
                    }
                    $scope.confirm = function() {
                        $scope.isLoading = true;
                        if (goal.me.isMuted == 0) {
                            GoalsDataServices.muteGoal(goal.id).success(function(res) {
                                $mdDialog.cancel();                               
                                goal.me.isMuted = 1;
                                $rootScope.Notify.UImessage("Successfully muted", "success", "right", 'top');
                                $scope.isLoading = false;
                            })
                        }
                        else {
                            GoalsDataServices.unMuteGoal(goal.id).success(function(res) {
                                $mdDialog.cancel();
                                goal.me.isMuted = 0;
                                $rootScope.Notify.UImessage("Successfully un-muted", "success", "right", 'top');
                                $scope.isLoading = false;
                            })
                        }
                    }                   
                }
                else {
                    $scope.title = "Will be implemented later";
                    $scope.ok = "Edit";
                }

            }
        }
    };
});;LinkagoalWebApp.directive('profileNav', function() {
    return {
        restrict: 'E',
        scope: {
            page: '=currentPage',
            profile: '=profile',
        },
        templateUrl: 'partials/sub-partials/_profile_navigation.tmpl',
        controller: ['$scope', '$state', '$filter', function($scope, $state, $filter) {
            $scope.$state = $state;
        }]
    };
});;LinkagoalWebApp.directive('accountSettingsNav', function() {
    return {
        restrict: 'E',
        scope: {
            page: '=currentPage',
        },
        templateUrl: 'partials/sub-partials/_account_settings_navigation.tmpl',
        controller: ['$scope', '$state', '$filter', '$rootScope', '$location', '$anchorScroll', function($scope, $state, $filter, $rootScope, $location, $anchorScroll) {
            // $scope.$state = $state;
            // $scope.user = $rootScope.me();
            $scope.class_state='personal';
            $scope.gotoAnchor = function(x) {
              var newHash = x;
              $scope.x = 'lg-active';
              $scope.class_state = x;
              if ($location.hash() !== newHash) {
                // set the $location.hash to `newHash` and
                // $anchorScroll will automatically scroll to it
                $location.hash(x);
              } else {
                // call $anchorScroll() explicitly,
                // since $location.hash hasn't changed
                $anchorScroll();
            }
            };
        }]
    };
});;LinkagoalWebApp.directive('feedback', function() {
    return {
        restrict: 'E',
        scope: {
            show: '=show',
        },
        templateUrl: 'partials/sub-partials/_feedback.tmpl',
        controller: ['$scope', 'FeedbackService', '$timeout', function($scope, FeedbackService, $timeout) {
            $scope.feedback = {}
            $scope.maxLength = 4000;
            $scope.class = "opencart";
            $scope.revertClass = function() {
                if ($scope.class === "opencart") {
                    $scope.class = "closecart";
                    $timeout(function(){
                        $scope.isSubmitted = false;
                    }, 700);
                    
                }
            };

            $scope.show = false;
            setTimeout(function() {
                $scope.show = true;
            }, 1500)

            $scope.class = "closecart";

            $scope.changeClass = function() {
                if ($scope.class === "closecart") $scope.class = "opencart";
            };

            $scope.isSubmitted = false;
            $scope.isProcessing = false;

            $scope.submit = function() {
                $scope.isProcessing = true;
                params = $scope.feedback;
                FeedbackService.submit(params).success(function(res) {
                    $scope.isProcessing = false;
                    $scope.feedback.text = null;
                    $scope.feedbackForm.$setPristine();
                    $scope.isSubmitted = true;
                }).error(function(err) {
                    $scope.isProcessing = false;
                })
                
            }

            // $scope.feedbackQuestions = [
            //     { question: "How was your goal making experience?", option1: "Great", option2: "Not bad", option3: "Complicated" },
            //     { question: "Do you like to motivate others?", option1: "Yes", option2: "No", option3: "Maybe" },
            //     { question: "Does creating Milestones help you?", option1: "Yes", option2: "No", option3: "Maybe" },
            //     { question: "How often do you use status update?", option1: "Very often", option2: "Often", option3: "Never" },
            //     { question: "Do contributions help you to achieve your goal?", option1: "Yes", option2: "No", option3: "Maybe" },
            //     { question: "Do you like getting suggested user’s updates in your newsfeed?", option1: "Yes", option2: "No", option3: "Maybe" },
            // ];
            //var qN = Math.floor((Math.random() * 5) + 1);
            //$scope.feedback = $scope.feedbackQuestions[qN];
        }]
    };
});;LinkagoalWebApp.directive("overlayTips", function($compile, $rootScope, $window, $timeout, CoachMarksDataServices) {

    var template = '<div ng-clock style="left:0; right:0; top:0; bottom:0" class="lg-overlay-cm"><div ng-esc></div><div class="lg-relative ">' +
        '<div  ng-style="{top:position.top, left:position.left}" class="lg-cm-module">' +
        '<div class="lg-cm-module-heading lg-pd-10 pbn">{{title}}</div>' +
        '<div class="lg-cm-module-content pam">{{description}}</div>' +
        '<div class="lg-cm-module-btnbox lg-m-align pam"><span class="close" ng-click="close(id)">{{btn}}</span></div>' +
        '</div>' +
        '</div></div>';
    return {
        restrict: 'A',
        scope: {
            id: '=id',
            title: '@title',
            description: '@description',
            icon: '@icon',
            type: '@type',
            btn: '@btn'
        },
        link: function(scope, element, attr) {

            setTimeout(function() {
                init()
                $window.addEventListener('resize', init);
            }, 2000)

            function init() {
                scope.position = {}
                scope.position.top = (element.parent().prop('offsetTop') + element.parent().prop('offsetHeight'));
                scope.position.left = ($(element.parent()).offset().left - 100 + (element.parent().prop('offsetWidth') / 2))
            }
            var timer;
            var entered = false;

            element.parent().bind("mouseover", function() {
                if (entered == false) {
                    entered = true;
                    timer = $timeout(function() {
                        scope.$apply(function() {
                            var content = $compile(template)(scope);
                            $('body').append(content);
                        })
                    }, 2000);
                }
            })

            element.parent().bind("mouseleave", function() {
                if (entered == true) {
                    $timeout.cancel(timer);
                    entered = false;
                }
            })

            element.parent().bind("mousedown", function() {
                if (entered == true) {
                    $timeout.cancel(timer);
                    entered = false;
                }
            })

            scope.close = function(id) {
                CoachMarksDataServices.seen(id).success(function(result) {
                    $rootScope.coachMarks[scope.type].seen = 1;
                });
                
                scope.$destroy();
            }

            scope.keyPressed = function(e) {
                if (e.which == 27 || e.which == 13) {
                    scope.close(scope.id)
                }
            };

            
            cleanUp = function () {
                setTimeout(function() {
                    $(".lg-overlay-cm").remove();
                    element.parent().off('mouseover');
                    element.parent().off('mouseleave');
                },100)
            };
            scope.$on('$destroy', cleanUp);
        }
    }


});;LinkagoalWebApp.directive('ngEsc', function($document) {
    return {
        restrict: 'AE',
        scope: true,
        link: function(scope, element, attrs) {
            $document.on("keydown keypress keyup", function(event) {
                scope.$apply(scope.keyPressed(event));
            });
        }
    }
});;LinkagoalWebApp.directive("shareOutside", function($compile, $rootScope) {

    var template = '<div class="lg-modal-overlay">' +
        '<div class="lg-modal-inner">' +
        '<span class="close" ng-click="close()"><i class="lg-icon-cross"></i></span>' +
        '<input onClick="this.select();"  onfocus="this.select();" class="link-box" type="text" disabled="disabled" value="{{url}}" />' +
        '<div class="social-network lg-m-align pts">' +
        '<a href="#" class="lg-facebook" title="Share on Facebook" socialshare socialshare-provider="facebook" socialshare-text="{{text}}" socialshare-url="{{url}}"><i class="lg-icon-facebook"></i></a>' +
        '<a href="#" class="lg-twitter" title="Share on Twitter" socialshare socialshare-provider="twitter" socialshare-text="{{text}}" socialshare-url="{{url}}"><i class="lg-icon-twitter"></i></a>' +
        '<a href="#" class="lg-linkedin" title="Share on Linkedin" socialshare socialshare-provider="linkedin" socialshare-text="{{text}}" socialshare-url="{{url}}"><i class="lg-icon-linked-in"></i></a>' +
        '<a href="#" class="lg-reddit" title="Share on Reddit" socialshare socialshare-provider="reddit" socialshare-text="{{text}}" socialshare-url="{{url}}"><i class="lg-icon-reddit"></i></a>' +
        '<a href="#" class="lg-digg" title="Share on Digg" socialshare socialshare-provider="digg" socialshare-text="{{text}}" socialshare-url="{{url}}"><i class="lg-icon-digg"></i></a>' +
        '<a href="#" class="lg-stumbleUpon" title="Share on StumbleUpon" socialshare socialshare-provider="stumbleupon" socialshare-text="{{text}}" socialshare-url="{{url}}"><i class="lg-icon-stumble-upon"></i></a>' +
        '<a href="#" class="lg-google" title="Share on Google" socialshare socialshare-provider="google+" socialshare-text="{{text}}" socialshare-url="{{url}}"><i class="lg-icon-google"></i></a>' +
        '<a href="#" class="lg-tumblr" title="Share on Tumblr" socialshare socialshare-provider="tumblr" socialshare-text="{{text}}" socialshare-url="{{url}}"><i class="lg-icon-tumblr"></i></a>' +
        '<a href="#" class="lg-vk" title="Share on VK" socialshare socialshare-provider="vk" socialshare-text="{{text}}" socialshare-url="{{url}}"><i class="lg-icon-vk"></i></a>' +
        '</div>' +
        '</div>' +
        '</div>';

    return {
        scope: {
            text: '@text',
            url: '@url',
        },
        link: function(scope, element) {
            element.on("click", function() {
                $rootScope.$broadcast("custom-model:open");
                scope.$apply(function() {
                    var content = $compile(template)(scope);
                    $('.shareBlock').append(content);
                })
            });
            scope.close = function() {
                $rootScope.$broadcast("custom-model:close");
                $('.shareBlock .lg-modal-overlay').remove();
            }
        }
    }
});;;LinkagoalWebApp.directive('headerBar', function() {
    return {
        restrict: 'A', //This menas that it will be used as an attribute and NOT as an element. I don't like creating custom HTML elements
        replace: true,
        scope: { user: '=' }, // This is one of the cool things :). Will be explained in post.
        templateUrl: "partials/sub-partials/header.html",
        controller: ['$scope', '$state', '$rootScope', 'User', 'NotificationDataServices', 'UserDataServices' , '$injector', function($scope, $state, $rootScope, User, NotificationDataServices, UserDataServices, $injector) {
            $scope.$state = $state;

            $scope.loggedInUser = User.getLoggedInUser();
            $scope.searchOpen = false;
            if (User.isAuthenticated()) {
                NotificationDataServices.get().success(function(res) {
                    $scope.notifications = res.data.notifications;
                    $scope.notSeenCount = res.data.unseen;
                })
            }
            $scope.seenNotification = false;
            $scope.readNotification = function(id) {
                NotificationDataServices.read(id);
            }

            $scope.seenAllNotification = function() {
                NotificationDataServices.seen().success(function(res) {
                    $scope.notSeenCount = 0;
                })
            }

            $scope.verifyBar = ($state.current.name == 'app.dashboard') && ($scope.loggedInUser.verified == false);

            /* Email Verification */
            $scope.isClicked = false;
            $scope.isVerificationBtnLoading = false;
            $scope.verifyAccount = function() {
                $scope.isVerificationBtnLoading = true;
                UserDataServices.verifyAccountRequest().success(function() {
                        $scope.isVerificationBtnLoading = false;
                        $scope.isClicked = true;
                    })
                    .error(function() {
                        $rootScope.Notify.UImessage("There was an error please try in a while", "error", "right", 'top');
                    })
            }

            $scope.moduleChatExists = modules.indexOf('app.chat') < 0 ? false : true;
        }]
    }
});;LinkagoalWebApp.directive('skCubeGrid', function() {
    return {
        restrict: 'E',
        template: '<div class="sk-cube-grid"><div class="sk-cube sk-cube1"></div><div class="sk-cube sk-cube2"></div><div class="sk-cube sk-cube3"></div><div class="sk-cube sk-cube4"></div><div class="sk-cube sk-cube5"></div><div class="sk-cube sk-cube6"></div><div class="sk-cube sk-cube7"></div><div class="sk-cube sk-cube8"></div><div class="sk-cube sk-cube9"></div></div>',
    };
});;LinkagoalWebApp.directive("mAppLoading", function($animate) {
    return ({
        link: link,
        restrict: "C"
    });

    function link(scope, element, attributes) {
        $animate.leave(element.children().eq(1)).then(
            function cleanupAfterAnimation() {
                element.remove();
                scope = element = attributes = null;
            }
        );
    }
});;LinkagoalWebApp.directive("stickySidebar", function($animate) {
    return ({
        link: link,
        restrict: "A",
        scope : {
        	additionalMarginTop: '@additionalMarginTop',
        }
    });

    function link(scope, element, attributes) {
    	var additionalMarginTop = scope.additionalMarginTop || 60;
        angular.element('.leftSidebar').theiaStickySidebar({ additionalMarginTop: additionalMarginTop, additionalMarginBottom: -5 });
    }
});;LinkagoalWebApp.directive('skWave', function() {
    return {
        template: '<div style="position: absolute; top: 0 ; bottom: 0; left: 0; right: 0; background-color:rgba(255,255,255,.8); z-index: 2">' +
            '<div class="sk-wave">' +
            '<div class="sk-rect sk-rect1"></div>' +
            '<div class="sk-rect sk-rect2"></div>' +
            '<div class="sk-rect sk-rect3"></div>' +
            '<div class="sk-rect sk-rect4"></div>' +
            '<div class="sk-rect sk-rect5"></div>' +
            '</div>' +
            '</div>'
    };
});;LinkagoalWebApp.directive('ngEnter', function() {
    return function(scope, element, attrs) {
        element.bind("keydown keypress", function(event) {
            if (event.which === 13) {
                scope.$apply(function() {
                    scope.$eval(attrs.ngEnter);
                });
                event.preventDefault();
            }
        });
    };
});;LinkagoalWebApp.directive('shiftEnter', function() {
    return {
        restrict: 'A',
        link: function(scope, elem, attrs) {

            elem.bind('keydown', function(event) {
                var code = event.keyCode || event.which;

                if (code === 13) {
                    if (!event.shiftKey) {
                        event.preventDefault();
                        scope.$apply(attrs.shiftEnter);
                    }
                }
            });
        }
    }
});
;LinkagoalWebApp.directive('mySpace', function() {
    return function(scope, element, attrs) {
        console.log(scope);
        element.bind("keypress", function(event) {
            console.log(event.keyCode)
            if (event.keyCode == 13) {
                console.log(scope);
                scope.$apply(function() {

                    //console.log(scope);
                    //scope.$eval(attrs.myEnter);
                });
                event.preventDefault();
            }
        });
    };
});;LinkagoalWebApp.directive('directiveScrolling', function() {
    function moveBy(delta) {

        $scrollable = $('.scrollable'),
            curScroll = $scrollable.scrollLeft(),
            scrollTo = curScroll + delta;
        $scrollable.animate({ scrollLeft: scrollTo }, 500);
    }
    return {
        link: function(scope, elem, attrs) {
            scope.scrollLeft = function() {
                moveBy((-1) * elem.width());

            };
            scope.scrollRight = function() {
                moveBy(elem.width());
            };
        }
    };
});;LinkagoalWebApp.directive('directiveScrollingTwo', function() {
    function moveBy(delta, elem) {
        $scrollable = $('.scrollable2'),
            curScroll = $scrollable.scrollLeft(),
            scrollTo = curScroll + delta;
        //scrollTo = (delta > 0) ? Math.min(scrollTo, $(window).width()) : Math.max(scrollTo, 0);
        $scrollable.animate({ scrollLeft: scrollTo }, 500);
    }
    return {
        link: function(scope, elem, attrs) {
            scope.scrollLeft2 = function() {
                moveBy((-1) * elem.width());
            };
            scope.scrollRight2 = function() {
                moveBy(elem.width());
            };
        }
    };
});;LinkagoalWebApp.directive('searchOnKeyDown', function(SearchDataServices) {
    return {
        controller: ['$scope', '$timeout', function($scope, $timeout) {
            $scope.searchOpen = false;
            $scope.toggleSearch = function() {
                console.log('toggle');
                $scope.searchOpen = !$scope.searchOpen;

                if ($scope.searchOpen) {
                    $scope.$window.onclick = function(event) {
                        closeSearchWhenClickingElsewhere(event, $scope.toggleSearch);
                    };
                } else {
                    $scope.searchOpen = false;
                    $scope.$window.onclick = null;
                    $scope.$apply();
                }
            };

            function closeSearchWhenClickingElsewhere(event, callbackOnClose) {
                var clickedElement = event.target;
                if (!clickedElement) return;
                var elementClasses = clickedElement.classList;
                var clickedOnSearchDrawer = elementClasses.contains('handle-right') || elementClasses.contains('drawer-right') || (clickedElement.parentElement !== null && clickedElement.parentElement.classList.contains('drawer-right'));

                if (!clickedOnSearchDrawer) {
                    callbackOnClose();
                    return;
                }
            }
            $scope.searchQuery = "";
            $scope.isLoading = false;

            var filterTextTimeout;
            $scope.$watch('searchQuery', function(val) {
                if (filterTextTimeout) {$timeout.cancel(filterTextTimeout);};
                if ($scope.searchQuery.length > 1) {
                    filterTextTimeout = $timeout(function() {
                        var stripWithHashForServer = $scope.searchQuery.replace(/[#]*/i, '');
                        $scope.searchResult = [];
                        $scope.isLoading = true;
                        $scope.searchOpen = true;
                        SearchDataServices.miniSearch(stripWithHashForServer).success(function(result) {
                            $scope.searchResult = result.data;
                            $scope.isLoading = false;
                        })
                    }, 300);
                } else {
                    $scope.searchOpen = false;
                }
            })
        }]
    }
});
;LinkagoalWebApp.directive('imageCropper', function() {
    // Runs during compile
    return {
        // name: '',
        // priority: 1,
        // terminal: true,
        // scope: {}, // {} = isolate, true = child, false/undefined = no change
        controller: function($scope, $element, $attrs, $transclude, $timeout, FileService) {
            $scope.cropper = {};
            $scope.cropperProxy = 'cropper.first';

            $scope.zoomDelta = 50;
            $scope.zoomTo = function(delta) {
                delta = delta / 100;
                $scope.cropper.first('zoomTo', delta);
            }

            $scope.clear = function(degrees) {
                if (!$scope.cropper.first) return;
                $scope.cropper.first('clear');
            };

            $scope.options = {
                maximize: true,
                aspectRatio: $scope.aspectRatio,
                //aspectRatio: 49 / 17,
                movable: true,
                zoomable: true,
                scalable: false,
                movable: true,
                rotatable: true,
                dragMode: 'move',
                minCropBoxWidth : 200,
                minCropBoxHeight: 200,
                crop: function(dataNew) {
                    $scope.newCropData = dataNew;
                },
                built: function(e) {
                    $scope.cropper.first('zoomTo', 0.5);
                    $scope.isFileResizeReady = true;
                    $scope.imageProcessingLoader = false;
                }
            };

            $scope.showEvent = 'show';
            $scope.hideEvent = 'hide';

            function showCropper() { $scope.$broadcast($scope.showEvent); }

            function hideCropper() { $scope.$broadcast($scope.hideEvent); }


            $scope.uploadFile = function(file) {
                if (file && $scope.imageType) {
                    $scope.imageProcessingLoader = true;
                    FileService.setType($scope.imageType);
                    FileService.uploadFile(file).then(function(result) {
                        $scope.dataUrl = result.data.data.file.original;
                        $scope.image = result.data.data;
                        $timeout(showCropper);
                    })
                }
            }

            var rotate = function(degrees) {
                $scope.cropper.first('rotate', degrees);
                $scope.cropper.first('zoomTo', 0.5);
                $scope.cropper.first('renderCropBox');
            }

            $scope.rotateLeft = function() { rotate(-90); }
            $scope.rotateRight = function() { rotate(90); }

            $scope.isFileResizeReady = false;
            $scope.imageProcessingLoader = false;
            $scope.image = {}


            $scope.cropNow = function() {
                $scope.imageProcessingLoader = true;
                FileService.cropImage($scope.image.fileId, $scope.newCropData).success(function(res) {
                    $scope.$broadcast('ev_imageCropperSave', { data: $scope.image });
                })
            }

        },
        // require: 'ngModel', // Array = multiple requires, ? = optional, ^ = check parent elements
        // restrict: 'A', // E = Element, A = Attribute, C = Class, M = Comment
        // template: '',
        templateUrl: '/partials/sub-partials/_image_cropping.html',
        // replace: true,
        // transclude: true,
        // compile: function(tElement, tAttrs, function transclude(function(scope, cloneLinkingFn){ return function linking(scope, elm, attrs){}})),
        link: function($scope, iElm, iAttrs, controller) {

        }
    };
});;LinkagoalWebApp.directive('notLoggedInModal', [function() {
    return {
        // restrict: 'A', // E = Element, A = Attribute, C = Class, M = Comment
        template: '<div class="lg-modal-overlay">' +
            '<div class="lg-modal-inner lg-m-align">' +
            '<h1 class="man">Logged out</h1>' +
            '<div class="ptm">You were logged out of Linkagoal. Please Login back to continue.</div>' +
            '<div class="ptl"><a href="{{$root.site_url(\'/login\')}}" md-button class="lg-controller-btn">Login</a></div>' +
            '</div>' +
            '</div>',
        // link: function($scope, iElm, iAttrs, controller) {}
    };
}]);;LinkagoalWebApp.directive('loading', ['$http', function($http) {
    return {
        restrict: 'A',
        link: function(scope, elm, attrs) {
            scope.isLoading = function() {
                return $http.pendingRequests.length > 0;
            };
            scope.$watch(scope.isLoading, function(v) {
                if (v) {
                    //elm.show();
                    elm.children(".load-container").removeClass("ds-none");
                    elm.children(".load-container").addClass("ds-blk");
                    elm.children(".brand-logo").addClass("two");
                } else {
                    //elm.hide();
                    elm.children(".load-container").removeClass("ds-blk");
                    elm.children(".load-container").addClass("ds-none");
                    elm.children(".brand-logo").removeClass("two");
                }
            });
        }
    };
}]);;LinkagoalWebApp.directive('mdLightbox', ['$mdDialog', function($mdDialog) {
    return {
        scope: {
            media: '=media',
        },
        link: function($scope, elem, attrs) {
            elem.addClass('image-click');
            elem.on('click', function() {
                var media = $scope.media;
                var title = attrs.mdLightboxTitle;
                showLightboxModal(media, title);
            });

            function showLightboxModal(media, title) {
                var confirm = $mdDialog.confirm({
                    templateUrl: '/partials/sub-partials/lightbox.html',
                    clickOutsideToClose: true,
                    controller: lightboxController
                });
                $mdDialog.show(confirm);

                function lightboxController($scope, $mdDialog) {
                    $scope.media = media;
                    $scope.title = title;
                    $scope.cancel = function() {
                        $mdDialog.cancel();
                    };
                }
            }
        }
    }
}]);;LinkagoalWebApp.directive('whenScrollEnds', function() {
    return {
        restrict: "AE",
        scope: true,
        link: function(scope, element, attrs) {
            var threshold = 20;
            element.scroll(function() {
                var visibleHeight = element.height();

                var scrollableHeight = element.prop('scrollHeight');

                var hiddenContentHeight = scrollableHeight - visibleHeight;
                if ((hiddenContentHeight - element.scrollTop() <= threshold) && scope.scrolldisabled == false) {
                    scope.$apply(attrs.whenScrollEnds);
                }
            });
        }
    };
});;LinkagoalWebApp.directive('whenTopScrollEnds', ['$timeout', function($timeout) {
    return {
        restrict: "A",
        link: function(scope, element, attrs) {
            var visibleHeight = element.height();
            var threshold = 10;
            var touched = false;

            element.scroll(function() {
                var scrollableHeight = element.prop('scrollHeight');
                var hiddenContentHeight = scrollableHeight - visibleHeight;

                if ((hiddenContentHeight - element.scrollTop() <= threshold) && touched == false) {
                    touched = true;
                    //scope.$apply(attrs.whenScrollEnds);
                }
            });

        }
    };
}]);;LinkagoalWebApp.directive('whenScrolled', ['$timeout', function($timeout) {
    return function(scope, elm, attr) {
        var raw = elm[0];

        elm.bind('scroll', function() {
            if (raw.scrollTop <= 100) {
                var sh = raw.scrollHeight
                scope.$apply(attr.whenScrolled).then(function() {
                    $timeout(function() {
                        raw.scrollTop = raw.scrollHeight - sh;
                    })
                });
            }
        });
    };
}]);;LinkagoalWebApp.directive('scrollBottomOn', ['$timeout', function($timeout) {
    return function(scope, elm, attr) {
        scope.$watch(attr.scrollBottomOn, function(value) {

            if (value) {
                $timeout(function() {
                    elm[0].scrollTop = elm[0].scrollHeight;
                });
            }
        });
    }
}]);;LinkagoalWebApp.directive('mentionExample', function($http, GoalsDataServices, $filter) {
    return {
        require: 'uiMention',
        link: function link($scope, $element, $attrs, uiMention) {
            /**
             * $mention.findChoices()
             *
             * @param  {regex.exec()} match    The trigger-text regex match object
             * @todo Try to avoid using a regex match object
             * @return {array[choice]|Promise} The list of possible choices
             */
            uiMention.findChoices = function(match, mentions) {

                return GoalsDataServices.userConnections(match[1], { offset: 0, limit: 5 })
                    .then(function(searchResults) {
                        var choices = [];
                        searchResults.data = searchResults.data.data;
                        for (var i = 0; i < searchResults.data.length; i++) {
                            choices.push({ name: searchResults.data[i].name, profileImage: searchResults.data[i].profile.small, id: searchResults.data[i].uid });
                        }

                        // Remove items that are already mentioned
                        return choices.filter(function(choice) {
                            return !mentions.some(function(mention) {
                                return mention.id === choice.id;
                            });
                        })

                    });

            };
        }
    };
});;LinkagoalWebApp.filter('mentionParser', function($sce) {
    return function(text, res) {
        var text;
        var regex = /[@[0-9]+[:]([a-z|A-Z ]+)]/g;
        var idSeprator = /[0-9]+/g;
        var displaySeprator = /([a-z|A-Z ]+)/g;
        var pattern = text.match(regex);
        var uidList = [];
        var textCopy = text;
        var mentions = [];

       
        if (pattern != null) {
            
            for (var i = 0; i < pattern.length; i++) {
                if (pattern[i].match(idSeprator) && pattern[i].match(displaySeprator)) {
                    uidList.push({
                        uid: pattern[i].match(idSeprator)[0],
                        displayName: pattern[i].match(displaySeprator)[0],
                        pattern: pattern[i],
                    });
                }
            }
            
            var commentid = text;
            angular.forEach(res.mentionList, function(value, index) {
                angular.forEach(uidList, function(object, index1) {
                    if (value.uid == object.uid) {
                        // var name = '<hovercard hover-tmpl-url="/partials/sub-partials/user-hovercard.tmpl" hc-id="'+value.uid+'" hc-type="user" context-visiblity="visible" placement="bottomRight">'+
                        //     '<a href="/' + value.username + '" class="lg-user mentioned hovercard">' + value.name + '</a>'+
                        // '</hovercard>';
                        var name = '<a class="mentioned" href="/' + value.username + '">' + value.name + '</a>';
                        var mentiontext = $sce.trustAsHtml(name);
                        textCopy = textCopy.replace(pattern[index1], mentiontext);
                    }

                })
            })


            return textCopy;

        } else {
            return text;
        }
    }
});
;LinkagoalWebApp.filter('onEmpty', function() {
    return function(value, str) {
        if (!value) {
            if (!str) {
                return 'n/a';
            }
            return str;
        }
        return value;
    };
});;LinkagoalWebApp.directive('readableTimeFilter', ['$timeout', function($timeout) {
    function update(scope) {
        var seconds = scope.time;
        scope.converted = readableTime(seconds);
        $timeout(function() { update(scope); }, 60000);
    }

    function readableTime(seconds) {
        var day, format, hour, minute, month, week, year;
        var currentTime = Math.floor(Date.now() / 1000);
        seconds = parseInt((currentTime - seconds));
        minute = 60;
        hour = minute * 60;
        day = hour * 24;
        week = day * 7;
        year = day * 365;
        month = year / 12;
        format = function(number, string) {
            if (string == 'day' || string == 'week' || string == 'hr') {
                string = number === 1 ? string : "" + string + "s";
            }
            //string = number === 1 ? string : "" + string + "s";
            return "" + number + " " + string;
        };
        switch (false) {
            case !(seconds < minute):
                return 'few secs ago';
            case !(seconds < hour):
                return format(Math.floor(seconds / minute), 'min');
            case !(seconds < day):
                return format(Math.floor(seconds / hour), 'hr');
            case !(seconds < week):
                return format(Math.floor(seconds / day), 'day');
            case !(seconds < month):
                return format(Math.floor(seconds / week), 'week');
            case !(seconds < year):
                return format(Math.floor(seconds / month), 'mon');
            default:
                return format(Math.floor(seconds / year), 'yr');
        }
    };
    return {
        restrict: 'A',
        scope: {
            time: '=time',
            converted: '=converted'
        },
        link: function(scope, element, attrs) {
            update(scope);
            scope.$watch('time', function(value) {
                update(scope);
            });
        }
    };
}])
;/*LinkagoalWebApp.directive('readMoreText', function() {
    return {
        restrict: 'A',
        transclude: true,
        replace: true,
        template: '<p></p>',
        scope: {
            moreText: '@',
            lessText: '@',
            words: '@',
            ellipsis: '@',
            char: '@',
            limit: '@',
            content: '@'
        },
        link: function(scope, elem, attr, ctrl, transclude) {
            var moreText = angular.isUndefined(scope.moreText) ? ' <a class="read-more">Read More...</a>' : ' <a class="read-more">' + scope.moreText + '</a>',
                lessText = angular.isUndefined(scope.lessText) ? ' <a class="read-less">Less ^</a>' : ' <a class="read-less">' + scope.lessText + '</a>',
                ellipsis = angular.isUndefined(scope.ellipsis) ? '' : scope.ellipsis,
                limit = angular.isUndefined(scope.limit) ? 150 : scope.limit;

            attr.$observe('content', function(str) {
                readmore(str);
            });

            transclude(scope.$parent, function(clone, scope) {
                readmore(clone.text().trim());
            });

            function readmore(text) {

                var text = text,
                    orig = text,
                    regex = /\s+/gi,
                    charCount = text.length,
                    wordCount = text.trim().replace(regex, ' ').split(' ').length,
                    countBy = 'char',
                    count = charCount,
                    foundWords = [],
                    markup = text,
                    more = '';

                if (!angular.isUndefined(attr.words)) {
                    countBy = 'words';
                    count = wordCount;
                }

                if (countBy === 'words') { // Count words

                    foundWords = text.split(/\s+/);

                    if (foundWords.length > limit) {
                        text = foundWords.slice(0, limit).join(' ') + ellipsis;
                        more = foundWords.slice(limit, count).join(' ');
                        markup = text + moreText + '<span class="more-text">' + more + lessText + '</span>';
                    }

                } else { // Count characters

                    if (count > limit) {
                        text = orig.slice(0, limit) + ellipsis;
                        more = orig.slice(limit, count);
                        markup = text + moreText + '<span class="more-text">' + more + lessText + '</span>';
                    }

                }

                elem.append(markup);
                elem.find('.read-more').on('click', function() {
                    $(this).hide();
                    elem.find('.more-text').addClass('show').slideDown();
                });
                elem.find('.read-less').on('click', function() {
                    elem.find('.read-more').show();
                    elem.find('.more-text').hide().removeClass('show');
                });

            }
        }
    };
});*/;LinkagoalWebApp.directive('metaTags', function() {
    return {
        scope: {
            seo: '=seo'
        },
        restrict: 'E',
        template: '' +
            '<update-title ng-if="seo.title" title="{{seo.title}}"></update-title>' +
            '<update-meta ng-if="seo.description" name="description" content="{{seo.description}}"></update-meta>' +
            '<update-meta ng-if="seo.title" property="og:title" content="{{seo.title}}"></update-meta>' +
            '<update-meta ng-if="seo.image" property="og:image" content="{{seo.image}}"></update-meta>' +
            '<update-meta ng-if="seo.description" property="og:description" content="{{seo.description}}"></update-meta>' +
            '<update-meta ng-if="seo.description" itemprop="description" content="{{seo.description}}"></update-meta>' +
            '<update-meta ng-if="seo.robots" name="robots" content="{{seo.robots}}"></update-meta>' +
            '',
        link: function(scope, element, attrs) {}
    };
});

String.prototype.htmlentities = function() {
    return this.replace(/[\u00A0-\u9999<>\&]/gim, function(i) {
        return '&#' + i.charCodeAt(0) + ';';
    });
}
;LinkagoalWebApp.directive('suggestUsers', [function(){
    return {
        restrict: 'A',
        scope: {
            users: '=users',
        },
        templateUrl: 'partials/sub-partials/_suggested_users.html'
    };
}]);;LinkagoalWebApp.service('site', [function() {
    this.url = function(path) {
        path = path || "/";
        return document.location.origin + path
    }
}])

LinkagoalWebApp.service("progress", ["$rootScope", "ngProgressFactory", function($rootScope, ngProgressFactory) {
    $rootScope.$on("event:endProgress", function() {
        $rootScope.progressbar.complete()
    });
    $rootScope.$on("event:startProgress", function() {
        if (typeof $rootScope.progressbar == "undefined") {
            $rootScope.progressbar = ngProgressFactory.createInstance();
        }
        $rootScope.progressbar.reset();
        $rootScope.progressbar.start();
    })
}]);

LinkagoalWebApp.service("Notify", ["$rootScope", "Notification", function($rootScope, Notification) {
    this.UImessage = function(message, type, positionX, positionY) {
        _type = type || "info";
        _positionX = positionX || "right"
        _positionY = positionY || "top"
        Notification({ message: message, type: _type, positionY: _positionY, positionX: _positionX });
    }
}]);

LinkagoalWebApp.service('ScrollService', ['UserDataServices', 'GoalsDataServices', 'Post', function(UserDataServices, GoalsDataServices, Post) {
    this.loadMoreFollowers = function(id, scope, offset, limit) {
        scope.scrolldisabled = true;
        scope.loading = true;
        UserDataServices.getUserFollowers(id, { offset: offset, limit: limit }).success(function(result) {
            if (result.data.followers.users.length < 5) {
                scope.users = scope.users.concat(result.data.followers.users);
                scope.scrolldisabled = true;
                scope.loading = false;
            } else {
                scope.users = scope.users.concat(result.data.followers.users);
                scope.loading = false;
                scope.scrolldisabled = false;
            }
        })
    }

    this.loadMoreFollowings = function(id, scope, offset, limit) {
        scope.scrolldisabled = true;
        scope.loading = true;
        UserDataServices.getUserFollowing(id, { offset: offset, limit: limit }).success(function(result) {
            if (result.data.followings.users.length < 5) {
                scope.users = scope.users.concat(result.data.followings.users);
                scope.scrolldisabled = true;
                scope.loading = false;
            } else {
                scope.users = scope.users.concat(result.data.followings.users);
                scope.loading = false;
                scope.scrolldisabled = false;
            }
        })
    }

    this.loadMoreMutualFollowings = function(id, scope, offset, limit) {
        scope.scrolldisabled = true;
        scope.loading = true;
        UserDataServices.getUserMutual(id, { offset: offset, limit: limit }).success(function(result) {
            if (result.data.mutualFollowings.users.length < 5) {
                scope.users = scope.users.concat(result.data.mutualFollowings.users);
                scope.scrolldisabled = true;
                scope.loading = false;
            } else {
                scope.users = scope.users.concat(result.data.mutualFollowings.users);
                scope.loading = false;
                scope.scrolldisabled = false;
            }
        })
    }

    this.loadMoreGoalFollowers = function(id, scope, offset, limit) {
        scope.scrolldisabled = true;
        scope.loading = true;
        GoalsDataServices.getFollowers(id, { offset: offset, limit: limit }).success(function(result) {
            if (result.data.users.length < 5) {
                scope.users = scope.users.concat(result.data.users);
                scope.scrolldisabled = true;
                scope.loading = false;
            } else {
                scope.users = scope.users.concat(result.data.users);
                scope.loading = false;
                scope.scrolldisabled = false;
            }
        })
    }

    this.loadMorePostMotivators = function(id, scope, offset, limit) {
        scope.scrolldisabled = true;
        scope.loading = true;
        Post.getMotivators(id, { offset: offset, limit: limit }).success(function(result) {
            if (result.data.users.length < 5) {
                scope.users = scope.users.concat(result.data.users);
                scope.scrolldisabled = true;
                scope.loading = false;
            } else {
                scope.users = scope.users.concat(result.data.users);
                scope.loading = false;
                scope.scrolldisabled = false;
            }
        })
    }

}])

LinkagoalWebApp.factory("locationService", ['$q', function($q) {
    vm = {};
    vm.gmapsService = new google.maps.places.AutocompleteService();

    vm.search = function(address) {
        if (address == null || address == "") return false;
        var deferred = $q.defer();
        getResults(address).then(
            function(predictions) {
                var results = [];
                for (var i = 0, prediction; prediction = predictions[i]; i++) {
                    results.push(prediction.description);
                }
                deferred.resolve(results);
            }
        );
        return deferred.promise;
    }

    function getResults(address) {
        var deferred = $q.defer();

        // $http.get('http://maps.googleapis.com/maps/api/geocode/json', {
        //   params: {
        //     address: address,
        //     sensor: false
        // }
        // }).success(function(res) {
        //   deferred.resolve(res.results);
        // }) 
        vm.gmapsService.getQueryPredictions({ input: address }, function(data) {
            deferred.resolve(data);
        });
        return deferred.promise;
    }


    return vm;
}]);


LinkagoalWebApp.factory('errorInterceptor', ['$q', '$rootScope', 'progress', function($q, $rootScope, progress) {
    return {
        request: function(config) {
            //$rootScope.$broadcast("event:startProgress");
            return config || $q.when(config);
        },
        requestError: function(request) {
            //$rootScope.$broadcast("event:endProgress");

            return $q.reject(request);
        },
        response: function(response) {
            //$rootScope.$broadcast("event:endProgress");
            return response || $q.when(response);
        },
        responseError: function(response) {
            //$rootScope.$broadcast("event:endProgress");
            if (response && response.status === 401) {

            }
            if (response && response.status === 404) {

            }
            if (response && response.status >= 500) {}
            return $q.reject(response);
        }
    };
}]);

LinkagoalWebApp.filter('nonEmpty', function() {
    return function(object) {
        return !!(object && Object.keys(object).length > 0);
    };
});


LinkagoalWebApp.service('pageGuideLS', function(localStorageService) {
    this.get = function(popName) {
        pg = localStorageService.get('pg');
        if (pg == null) return false;
        if (pg.hasOwnProperty(popName)) {
            return true;
        } else {
            return false;
        }
    }

    this.set = function(popName) {
        newPg = {}
        pg = localStorageService.get('pg');
        if (pg != null) {
            newPg = pg
        }
        newPg[popName] = 1
        localStorageService.set("pg", newPg);
    }
})



/*LinkagoalWebApp.filter('parseUrlFilter', function() {
var urlPattern = /(www|http|ftp|https):\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?/gi;
return function(text, target, otherProp) {
    target = "_blank";
    angular.forEach(text.match(urlPattern), function(url) {
        var urlPos = text.indexOf(url);
        if(text.substr(urlPos-6,4).indexOf('src') == -1){
            text = text.replace(url, "<a rel=\"nofollow\" target=\"" + target + "\" href="+ url + ">" + url +"</a>");
        }
    });
    return text;
};
});*/



// .factory('name', ['', function(){
//   var Education = {}
//   var Work = {}
//   function setEducation(edu){
//     Education = edu;
//   };

//   function getEducation(){
//     return Education
//   };

//   function setWork(work){
//     Work = work;
//   }; 

//   function getWork(){
//     return Work;
//   };

//   return {
//     setEducation : setEducation,

//   }

// }])

LinkagoalWebApp.filter('makeRange', function() {
    return function(input) {
        var lowBound, highBound;
        switch (input.length) {
            case 1:
                lowBound = 0;
                highBound = parseInt(input[0]) - 1;
                break;
            case 2:
                lowBound = parseInt(input[0]);
                highBound = parseInt(input[1]);
                break;
            default:
                return input;
        }
        var result = [];
        if (lowBound > highBound)
            for (var i = lowBound; i >= highBound; i--) result.push(i);
        if (lowBound < highBound)
            for (var i = lowBound; i <= highBound; i++) result.push(i);
        return result;
    };
});

LinkagoalWebApp.filter('readableTime', function() {
    return function(seconds) {
        var day, format, hour, minute, month, week, year;
        var currentTime = Math.floor(Date.now() / 1000);
        seconds = parseInt((currentTime - seconds));
        minute = 60;
        hour = minute * 60;
        day = hour * 24;
        week = day * 7;
        year = day * 365;
        month = year / 12;
        format = function(number, string) {
            if (string == 'day' || string == 'week' || string == 'hr') {
                string = number === 1 ? string : "" + string + "s";
            }
            //string = number === 1 ? string : "" + string + "s";
            return "" + number + " " + string;
        };
        switch (false) {
            case !(seconds < minute):
                return 'few seconds ago';
            case !(seconds < hour):
                return format(Math.floor(seconds / minute), 'min');
            case !(seconds < day):
                return format(Math.floor(seconds / hour), 'hr');
            case !(seconds < week):
                return format(Math.floor(seconds / day), 'day');
            case !(seconds < month):
                return format(Math.floor(seconds / week), 'week');
            case !(seconds < year):
                return format(Math.floor(seconds / month), 'mon');
            default:
                return format(Math.floor(seconds / year), 'yr');
        }
    };
})

.filter('onEmpty', function() {
    return function(value, str) {
        if (!value) {
            if (!str) {
                return 'n/a';
            }
            return str;
        }
        return value;
    };
})

LinkagoalWebApp.filter('notificationHighlight', function() {
    return function(input, start, end) {
        var output = '<span class="txt-book">' + input.substring(start, end) + '</span> ' + input.substring(end, input.length);
        return output;
    }
})

.filter('YouFilter', function(User) {
    return function(input, id) {
        if (id == User.suid) {
            return "You";
        } else {
            return input;
        }
    }
})

.filter('newLine', function() {
    return function(input) {
        return input.replace("\\n", "\n")
    }
})

.service('App', function($q, User) {
    this.init = function() {
        var deferred = $q.defer();
        isAuthenticated = User.isAuthenticated();

        if ((isAuthenticated == true)) {
            deferred.resolve(true);
        } else { deferred.reject(false) }

        return deferred.promise;
    }
});


LinkagoalWebApp.filter('notificationkeyStrings', function() {
    var list = []
    list["LOGIN"] = " Alert on account login from a new browser or device"
    list["GOAL_FOLLOWED"] = "Someone followed my goal"
    list["USER_FOLLOWED"] = "Someone followed my profile"
    list["PROGRESS_UPDATED"] = "Progress Update on goal I am linked with or following"
    list["CONTRIBUTION"] = "Someone contributed on my goal"
    list["MILESTONE_CREATED"] = "Milestone added on goal I am linked with or following"
    list["MILESTONE_COMPLETED"] = "Milestone completed on goal I am linked with or following"
    list["COMMENT"] = "Someone contributed on my activities"
    list["REPLY_ON_POSTCOMMENT"] = "Someone replied to my contribution"
    list["MOTIVATE_ON_POST"] = "Someone motivated on my activities"
    list["MOTIVATE_ON_GOAL"] = "Someone motivated on my goal"
    list["SHARE_GOAL"] = "Someone shared my goal"
    list["SHARE_POST"] = "Someone shared my post"
    list["LINK_GOAL"] = "Someone linked to my goal"
    list["USERMENTIONED"] = "Someone mentioned me"

    return function(key) {
        if (key) {
            return list[key];
        }
        return '';
    };
})

LinkagoalWebApp.service('LoginService', function($window) {
    this.get = function() {
        var finalObj = {};
        finalObj.screen_width = (screen.width) ? screen.width : '';
        finalObj.screen_height = (screen.height) ? screen.height : '';
        finalObj.useragent = navigator.userAgent || null;
        var platform = navigator.appName;
        var platform_version = '' + parseFloat(navigator.appplatform_version);
        var majorplatform_version = parseInt(navigator.appplatform_version, 10);
        var nameOffset, verOffset, ix;

        // Opera
        if ((verOffset = finalObj.useragent.indexOf('Opera')) != -1) {
            finalObj.platform = 'Opera';
            finalObj.platform_version = finalObj.useragent.substring(verOffset + 6);
            if ((verOffset = finalObj.useragent.indexOf('platform_version')) != -1) {
                finalObj.platform_version = finalObj.useragent.substring(verOffset + 8);
            }
        }
        // Opera Next
        if ((verOffset = finalObj.useragent.indexOf('OPR')) != -1) {
            finalObj.platform = 'Opera';
            finalObj.platform_version = finalObj.useragent.substring(verOffset + 4);
        }
        // MSIE
        else if ((verOffset = finalObj.useragent.indexOf('MSIE')) != -1) {
            finalObj.platform = 'Microsoft Internet Explorer';
            finalObj.platform_version = finalObj.useragent.substring(verOffset + 5);
        }
        // Chrome
        else if ((verOffset = finalObj.useragent.indexOf('Chrome')) != -1) {
            finalObj.platform = 'Chrome';
            finalObj.platform_version = finalObj.useragent.substring(verOffset + 7);
        }
        // Safari
        else if ((verOffset = finalObj.useragent.indexOf('Safari')) != -1) {
            finalObj.platform = 'Safari';
            finalObj.platform_version = finalObj.useragent.substring(verOffset + 7);
            if ((verOffset = finalObj.useragent.indexOf('platform_version')) != -1) {
                finalObj.platform_version = finalObj.useragent.substring(verOffset + 8);
            }
        }
        // Firefox
        else if ((verOffset = finalObj.useragent.indexOf('Firefox')) != -1) {
            finalObj.platform = 'Firefox';
            finalObj.platform_version = finalObj.useragent.substring(verOffset + 8);
        }
        // MSIE 11+
        else if (finalObj.useragent.indexOf('Trident/') != -1) {
            finalObj.platform = 'Microsoft Internet Explorer';
            finalObj.platform_version = finalObj.useragent.substring(finalObj.useragent.indexOf('rv:') + 3);
        }
        // Other platforms
        else if ((nameOffset = finalObj.useragent.lastIndexOf(' ') + 1) < (verOffset = finalObj.useragent.lastIndexOf('/'))) {
            finalObj.platform = finalObj.useragent.substring(nameOffset, verOffset);
            finalObj.platform_version = finalObj.useragent.substring(verOffset + 1);
            if (finalObj.platform.toLowerCase() == finalObj.platform.toUpperCase()) {
                finalObj.platform = navigator.appName;
            }
        }

        return finalObj;

        // return {
        //    uuid: $cordovaDevice.getDevice().uuid || null,
        //    platform: $cordovaDevice.getDevice().platform || ionic.Platform.platform() || null,
        //    platform_version: $cordovaDevice.getDevice().version || ionic.Platform.version() || null,
        //    model: $cordovaDevice.getDevice().model || null,
        //    mobile: $cordovaDevice.getDevice().manufacturer || null,
        //    isRetina: (window.devicePixelRatio > 1 ? 1 : 0) || null,
        //    screen_width: $window.innerWidth || null,
        //    screen_height: $window.innerHeight|| null,
        //    useragent: navigator.userAgent || null
        // } 
    }
});

/*
.filter('notificationHighlight', function() {
  return function(input, entities) {
    angular.forEach(values, function(entities, key){
      var output = '<span class="txt-book">'+input.substring(entities[key], entities[key]) + '</span> ' + input.substring(end, input.length);
    });
    var output = '<span class="txt-book">'+input.substring(start, end) + '</span> ' + input.substring(end, input.length);
    return output;
  }
});
*/
function getClientInfo(window) {
    var unknown = '-';

    // screen
    var screenSize = '';
    if (screen.width) {
        width = (screen.width) ? screen.width : '';
        height = (screen.height) ? screen.height : '';
    }

    // browser
    var nVer = navigator.appVersion;
    var nAgt = navigator.userAgent;
    var browser = navigator.appName;
    var version = '' + parseFloat(navigator.appVersion);
    var majorVersion = parseInt(navigator.appVersion, 10);
    var nameOffset, verOffset, ix;

    // Opera
    if ((verOffset = nAgt.indexOf('Opera')) != -1) {
        browser = 'Opera';
        version = nAgt.substring(verOffset + 6);
        if ((verOffset = nAgt.indexOf('Version')) != -1) {
            version = nAgt.substring(verOffset + 8);
        }
    }
    // Opera Next
    if ((verOffset = nAgt.indexOf('OPR')) != -1) {
        browser = 'Opera';
        version = nAgt.substring(verOffset + 4);
    }
    // MSIE
    else if ((verOffset = nAgt.indexOf('MSIE')) != -1) {
        browser = 'Microsoft Internet Explorer';
        version = nAgt.substring(verOffset + 5);
    }
    // Chrome
    else if ((verOffset = nAgt.indexOf('Chrome')) != -1) {
        browser = 'Chrome';
        version = nAgt.substring(verOffset + 7);
    }
    // Safari
    else if ((verOffset = nAgt.indexOf('Safari')) != -1) {
        browser = 'Safari';
        version = nAgt.substring(verOffset + 7);
        if ((verOffset = nAgt.indexOf('Version')) != -1) {
            version = nAgt.substring(verOffset + 8);
        }
    }
    // Firefox
    else if ((verOffset = nAgt.indexOf('Firefox')) != -1) {
        browser = 'Firefox';
        version = nAgt.substring(verOffset + 8);
    }
    // MSIE 11+
    else if (nAgt.indexOf('Trident/') != -1) {
        browser = 'Microsoft Internet Explorer';
        version = nAgt.substring(nAgt.indexOf('rv:') + 3);
    }
    // Other browsers
    else if ((nameOffset = nAgt.lastIndexOf(' ') + 1) < (verOffset = nAgt.lastIndexOf('/'))) {
        browser = nAgt.substring(nameOffset, verOffset);
        version = nAgt.substring(verOffset + 1);
        if (browser.toLowerCase() == browser.toUpperCase()) {
            browser = navigator.appName;
        }
    }
    // trim the version string
    if ((ix = version.indexOf(';')) != -1) version = version.substring(0, ix);
    if ((ix = version.indexOf(' ')) != -1) version = version.substring(0, ix);
    if ((ix = version.indexOf(')')) != -1) version = version.substring(0, ix);

    majorVersion = parseInt('' + version, 10);
    if (isNaN(majorVersion)) {
        version = '' + parseFloat(navigator.appVersion);
        majorVersion = parseInt(navigator.appVersion, 10);
    }

    // mobile version
    var mobile = /Mobile|mini|Fennec|Android|iP(ad|od|hone)/.test(nVer);

    // system
    var os = unknown;
    var clientStrings = [
        { s: 'Windows 10', r: /(Windows 10.0|Windows NT 10.0)/ },
        { s: 'Windows 8.1', r: /(Windows 8.1|Windows NT 6.3)/ },
        { s: 'Windows 8', r: /(Windows 8|Windows NT 6.2)/ },
        { s: 'Windows 7', r: /(Windows 7|Windows NT 6.1)/ },
        { s: 'Windows Vista', r: /Windows NT 6.0/ },
        { s: 'Windows Server 2003', r: /Windows NT 5.2/ },
        { s: 'Windows XP', r: /(Windows NT 5.1|Windows XP)/ },
        { s: 'Windows 2000', r: /(Windows NT 5.0|Windows 2000)/ },
        { s: 'Windows ME', r: /(Win 9x 4.90|Windows ME)/ },
        { s: 'Windows 98', r: /(Windows 98|Win98)/ },
        { s: 'Windows 95', r: /(Windows 95|Win95|Windows_95)/ },
        { s: 'Windows NT 4.0', r: /(Windows NT 4.0|WinNT4.0|WinNT|Windows NT)/ },
        { s: 'Windows CE', r: /Windows CE/ },
        { s: 'Windows 3.11', r: /Win16/ },
        { s: 'Android', r: /Android/ },
        { s: 'Open BSD', r: /OpenBSD/ },
        { s: 'Sun OS', r: /SunOS/ },
        { s: 'Linux', r: /(Linux|X11)/ },
        { s: 'iOS', r: /(iPhone|iPad|iPod)/ },
        { s: 'Mac OS X', r: /Mac OS X/ },
        { s: 'Mac OS', r: /(MacPPC|MacIntel|Mac_PowerPC|Macintosh)/ },
        { s: 'QNX', r: /QNX/ },
        { s: 'UNIX', r: /UNIX/ },
        { s: 'BeOS', r: /BeOS/ },
        { s: 'OS/2', r: /OS\/2/ },
        { s: 'Search Bot', r: /(nuhk|Googlebot|Yammybot|Openbot|Slurp|MSNBot|Ask Jeeves\/Teoma|ia_archiver)/ }
    ];
    for (var id in clientStrings) {
        var cs = clientStrings[id];
        if (cs.r.test(nAgt)) {
            os = cs.s;
            break;
        }
    }

    var pixelRatio = 0;
    if ('deviceXDPI' in screen) { // IE mobile or IE
        pixelRatio = (screen.deviceXDPI / screen.logicalXDPI) || null;
    } else if (window.hasOwnProperty('devicePixelRatio')) { // other devices
        pixelRatio = window.devicePixelRatio || null;
    }
    var isRetina = (pixelRatio != null ? (+pixelRatio > 1 ? true : false) : null);
    var osVersion = unknown;

    if (/Windows/.test(os)) {
        osVersion = /Windows (.*)/.exec(os)[1];
        os = 'Windows';
    }

    switch (os) {
        case 'Mac OS X':
            osVersion = /Mac OS X (10[\.\_\d]+)/.exec(nAgt)[1];
            break;

        case 'Android':
            osVersion = /Android ([\.\_\d]+)/.exec(nAgt)[1];
            break;

        case 'iOS':
            osVersion = /OS (\d+)_(\d+)_?(\d+)?/.exec(nVer);
            osVersion = osVersion[1] + '.' + osVersion[2] + '.' + (osVersion[3] | 0);
            break;
    }

    return {
        screen_width: width,
        screen_height: height,
        model: browser,
        isRetina: isRetina,
        mobile: mobile,
        platform: os,
        platform_version: osVersion,
        uuid: null,
        useragent: nAgt
    };
}

LinkagoalWebApp.filter('orderObjectBy', function() {
    return function(items, field, reverse) {
        var filtered = [];
        angular.forEach(items, function(item) {
            filtered.push(item);
        });
        filtered.sort(function(a, b) {
            return (a[field] > b[field] ? 1 : -1);
        });
        if (reverse) filtered.reverse();
        return filtered;
    };
});


LinkagoalWebApp.filter('cut', function() {
    return function(value, wordwise, max, tail) {
        if (!value) return '';

        max = parseInt(max, 10);
        if (!max) return value;
        if (value.length <= max) return value;

        value = value.substr(0, max);
        if (wordwise) {
            var lastspace = value.lastIndexOf(' ');
            if (lastspace != -1) {
                //Also remove . and , so its gives a cleaner result.
                if (value.charAt(lastspace - 1) == '.' || value.charAt(lastspace - 1) == ',') {
                    lastspace = lastspace - 1;
                }
                value = value.substr(0, lastspace);
            }
        }

        return value + (tail || ' …');
    };
});
;Array.prototype.toURL = function() {
    return this.join('/');
};

var toQueryString = function(obj) {
    var out = new Array();
    for (key in obj) {
        out.push(key + '=' + encodeURIComponent(obj[key]));
    }
    return out.join('&');
};

angular.module('CoreApi', ['CoreApiUtilities'])

.constant('lagConfig', {
    appName: 'Linkagoal',
    appVersion: '2.1.0',
    apiUrl: "https://api.linkagoal.com/",
    fileApi: "https://i1.linkagoal.com/",
    socket: "https://socket.linkagoal.com",
})

.factory('httpService', ['$http', 'lagConfig', 'Utils', function($http, lagConfig, Utils) {
    return {
        $http: $http,
        lagConfig: lagConfig,
        Utils: Utils
    }
}])

.service('FeedServices', ['httpService', function(httpService) {

    this.getDashBoard = function(options) {
        var config = httpService.Utils.getHeader();
        var options = options || httpService.defaultOffsetLimit;
        var url = httpService.Utils.buildUrl(new Array('feed'), options);
        return httpService.$http.get(url, config)
    };

    this.getAlbum = function(id) {
        var config = httpService.Utils.getHeader();
        var url = httpService.Utils.buildUrl(new Array('album', id));
        return httpService.$http.get(url, config)
    };
}])

.service('NotificationDataServices', ['httpService', function(httpService) {
    var options = options || httpService.defaultOffsetLimit;

    this.get = function(options) {
        var config = httpService.Utils.getHeader();
        var url = httpService.Utils.buildUrl(new Array('notifications'), options);
        return httpService.$http.get(url, config)
    };

    this.read = function(id) {
        var config = httpService.Utils.getHeader();
        var url = httpService.Utils.buildUrl(new Array('notifications', 'read', id));
        return httpService.$http.put(url, {}, config);
    };

    this.seen = function() {
        var config = httpService.Utils.getHeader();
        var url = httpService.Utils.buildUrl(new Array('notifications', 'seen'));
        return httpService.$http.put(url, {}, config);
    };

    this.subscribe = function(token) {
        var config = httpService.Utils.getHeader();
        params = { device_subscription_token: params }
        var url = httpService.Utils.buildUrl(new Array('notifications', 'subscrbe'));
        return httpService.$http.post(url, params, config)
    }

    this.settings = function() {
        var config = httpService.Utils.getHeader();
        var url = httpService.Utils.buildUrl(new Array('account', 'notificationSettings'));
        return httpService.$http.get(url, config)
    };

    this.update = function(params) {
        var config = httpService.Utils.getHeader();
        var url = httpService.Utils.buildUrl(new Array('account', 'notificationSettings'));
        return httpService.$http.put(url, params, config);
    }

}])

.service('CoachMarksDataServices', ['httpService', function(httpService) {

    this.get = function() {
        var config = httpService.Utils.getHeader();
        var url = httpService.Utils.buildUrl(new Array('coachmarks', 'my'));
        return httpService.$http.get(url, config);
    };

    this.seen = function(id, params) {
        var config = httpService.Utils.getHeader();
        var url = httpService.Utils.buildUrl(new Array('coachmarks', id, 'done'));
        return httpService.$http.post(url, params, config);
    };
}])

.service('ResourceCenterServices', ['httpService', function(httpService) {

    this.get = function() {
        var config = httpService.Utils.getHeader();
        var url = httpService.Utils.buildUrl(new Array('resource-center'));
        return httpService.$http.get(url, config)
    };

    this.getArticle = function(id) {
        var config = httpService.Utils.getHeader();
        var url = httpService.Utils.buildUrl(new Array('resource-center', id));
        return httpService.$http.get(url, config)
    };

}])

.service('MilestoneServices', ['httpService', function(httpService) {

    this.achieve = function(id, params) {
        var config = httpService.Utils.getHeader();
        var url = httpService.Utils.buildUrl(new Array('milestones', id, "complete"));
        return httpService.$http.put(url, params, config);
    };

    this.editMilestone = function(id, params) {
        var config = httpService.Utils.getHeader();
        var url = httpService.Utils.buildUrl(new Array('goals', 'milestone', id));
        return httpService.$http.put(url, params, config)
    }

    this.deleteMilestone = function(id, params) {
        var config = httpService.Utils.getHeader();
        var url = httpService.Utils.buildUrl(new Array('goals', 'milestone', id));
        return httpService.$http.delete(url, config)
    }



}])

.service('PrivacyServices', ['httpService', function(httpService) {

    this.getSettings = function() {
        var config = httpService.Utils.getHeader();
        var url = httpService.Utils.buildUrl(new Array('settings', "privacy"));
        return httpService.$http.get(url, config);
    };
}])

.service('ExploreServices', ['httpService', function(httpService) {

    this.get = function() {
        var config = httpService.Utils.getHeader();
        var url = httpService.Utils.buildUrl(new Array('explore'));
        return httpService.$http.get(url, config)
    };

    this.popularGoals = function(options) {
        var config = httpService.Utils.getHeader();
        var options = options || httpService.defaultOffsetLimit;
        var url = httpService.Utils.buildUrl(new Array('explore', 'popular-goals'), options);
        return httpService.$http.get(url, config)
    };

    this.hotNewGoals = function(options) {
        var config = httpService.Utils.getHeader();
        options = options || {}
        var url = httpService.Utils.buildUrl(new Array('explore', 'hotnewgoals'), options);
        return httpService.$http.get(url, config)
    };

    this.featuredUsers = function(options) {
        var config = httpService.Utils.getHeader();
        options = options || {}
        var url = httpService.Utils.buildUrl(new Array('explore', 'featured-users'), options);
        return httpService.$http.get(url, config)
    };

    this.featuredTags = function() {
        var config = httpService.Utils.getHeader();
        var url = httpService.Utils.buildUrl(new Array('explore', 'featured-tags'));
        return httpService.$http.get(url, config)
    };

}])

.service('CategoriesServices', ['httpService', function(httpService) {

    this.getAll = function() {
        var config = httpService.Utils.getHeader();
        var url = httpService.Utils.buildUrl(new Array('categories'));
        return httpService.$http.get(url, config)
    };

    this.get = function(categoryId, options) {
        var config = httpService.Utils.getHeader();
        var options = options || httpService.defaultOffsetLimit;
        var url = httpService.Utils.buildUrl(new Array('categories', categoryId), options);
        return httpService.$http.get(url, config)
    };

    this.getSub = function(name, tag, options) {
        var config = httpService.Utils.getHeader();
        var url = httpService.Utils.buildUrl(new Array('categories', name, tag), options);
        return httpService.$http.get(url, config)
    };

    this.getAllCategoriesWithTags = function() {
        var config = httpService.Utils.getHeader();
        var url = httpService.Utils.buildUrl(new Array('categories', 'all'));
        return httpService.$http.get(url, config)
    };



}])

.service('SearchDataServices', ['httpService', function(httpService) {

    this.miniSearch = function(query) {
        var config = httpService.Utils.getHeader();
        var url = httpService.Utils.buildUrl(new Array('search', 'all'), { q: query });
        return httpService.$http.get(url, config)
    };

    this.users = function(name, options) {
        var config = httpService.Utils.getHeader();
        queryParams = { q: name, offset: options.offset, limit: options.limit }
        var url = httpService.Utils.buildUrl(new Array('search', 'user'), queryParams);
        return httpService.$http.get(url, config)
    };

    this.goals = function(name, options) {
        var config = httpService.Utils.getHeader();
        queryParams = { q: name, offset: options.offset, limit: options.limit }
        var url = httpService.Utils.buildUrl(new Array('search', 'goal'), queryParams);
        return httpService.$http.get(url, config)
    };

    this.tags = function(name, options) {
        var config = httpService.Utils.getHeader();
        queryParams = { q: name, offset: options.offset, limit: options.limit }
        var url = httpService.Utils.buildUrl(new Array('search', 'tag'), queryParams);
        return httpService.$http.get(url, config)
    };

}])

.service('TagsDataServices', ['httpService', function(httpService) {

    // remove this duplicated in SearchDataServices, found in ProfileInterestCtrl
    this.search = function(name) {
        var config = httpService.Utils.getHeader();
        var url = httpService.Utils.buildUrl(new Array('search', 'tag'), { q: name });
        return httpService.$http.get(url, config)
    };

    this.getTaggedGoals = function(name, options) {
        var config = httpService.Utils.getHeader();
        var options = options || httpService.defaultOffsetLimit;
        var url = httpService.Utils.buildUrl(new Array('tags', name), options);
        return httpService.$http.get(url, config)
    };
}])

.service('CommentDataServices', ['httpService', function(httpService) {

    this.getAll = function(id, options) {
        var config = httpService.Utils.getHeader();
        var options = options || httpService.defaultOffsetLimit;
        var url = httpService.Utils.buildUrl(new Array('posts', id, 'comments'), options);
        return httpService.$http.get(url, config)
    };

    this.post = function(id, params) {
        var config = httpService.Utils.getHeader();
        var url = httpService.Utils.buildUrl(new Array('posts', id, 'comments'));
        return httpService.$http.post(url, params, config)
    };

    this.delete = function(id) {
        var url = httpService.Utils.buildUrl(new Array('posts', 'comments', id));
        return httpService.$http.delete(url, config);
    }

}])

.service('Education', ['httpService', function(httpService) {
    this.add = function(uid, params) {
        var config = httpService.Utils.getHeader();
        var url = httpService.Utils.buildUrl(new Array('users', uid, 'educations'));
        return httpService.$http.post(url, params, config)
    };

    this.getAll = function(uid, options) {
        var config = httpService.Utils.getHeader();
        //var options = options || httpService.defaultOffsetLimit;
        var url = httpService.Utils.buildUrl(new Array('users', uid, 'educations'), options);
        return httpService.$http.get(url, config)
    };

    this.update = function(uid, id, params) {
        var config = httpService.Utils.getHeader();
        var url = httpService.Utils.buildUrl(new Array('users', uid, 'educations', id));
        return httpService.$http.put(url, params, config)
    };

    this.delete = function(uid, id) {
        var config = httpService.Utils.getHeader();
        var url = httpService.Utils.buildUrl(new Array('users', uid, 'educations', id));
        return httpService.$http.delete(url, config)
    };
}])

.service('Work', ['httpService', function(httpService) {
    this.add = function(uid, params) {
        var config = httpService.Utils.getHeader();
        var url = httpService.Utils.buildUrl(new Array('users', uid, 'works'));
        return httpService.$http.post(url, params, config)
    };

    this.getAll = function(uid, options) {
        var config = httpService.Utils.getHeader();
        //var options = options || httpService.defaultOffsetLimit;
        var url = httpService.Utils.buildUrl(new Array('users', uid, 'works'), options);
        return httpService.$http.get(url, config)
    };

    this.update = function(uid, id, params) {
        var config = httpService.Utils.getHeader();
        var url = httpService.Utils.buildUrl(new Array('users', uid, 'works', id));
        return httpService.$http.put(url, params, config)
    };

    this.delete = function(uid, id) {
        var config = httpService.Utils.getHeader();
        var url = httpService.Utils.buildUrl(new Array('users', uid, 'works', id));
        return httpService.$http.delete(url, config)
    };
}])

.service('Post', ['httpService', function(httpService) {
    this.create = function(params) {
        var config = httpService.Utils.getHeader();
        var url = httpService.Utils.buildUrl(new Array('posts'));
        return httpService.$http.post(url, params, config)
    };

    this.get = function(id) {
        var config = httpService.Utils.getHeader();
        var url = httpService.Utils.buildUrl(new Array('posts', id));
        return httpService.$http.get(url, config)
    }

    this.motivate = function(id, me) {
        var config = httpService.Utils.getHeader();
        var url = httpService.Utils.buildUrl(new Array('posts', id, 'motivation'));
        if (me == 0) {
            return httpService.$http.post(url, {}, config)
        } else {
            return httpService.$http.delete(url, {}, config)
        }
    }

    this.getMotivators = function(id, params) {
        var config = httpService.Utils.getHeader();
        var url = httpService.Utils.buildUrl(new Array('posts', id, 'motivators'), params);
        return httpService.$http.get(url, config)
    }

    this.followUnfollow = function(id, isFollowing) {
        var config = httpService.Utils.getHeader();
        if (isFollowing == 0) {
            var url = httpService.Utils.buildUrl(new Array('posts', id, 'follow'));
            return httpService.$http.post(url, {}, config)
        } else {
            var url = httpService.Utils.buildUrl(new Array('posts', id, 'unfollow'));
            return httpService.$http.delete(url, config)
        }
    };

    this.delete = function(id) {
        var config = httpService.Utils.getHeader();
        var url = httpService.Utils.buildUrl(new Array('posts', id));
        return httpService.$http.delete(url, config)
    }

}])

.service('UserDataServices', ['httpService', 'Education', 'Work', function(httpService, Education, Work) {

    this.login = function(params, client_id) {
        var config = httpService.Utils.getHeader();
        var client_id = client_id || 0
        var url = httpService.Utils.buildUrl(new Array('login'));
        if (client_id != 0) config.headers["x-client-id"] = client_id;
        return httpService.$http.post(url, params, config)
    };

    this.logout = function() {
        var config = httpService.Utils.getHeader();
        var url = httpService.Utils.buildUrl(new Array('logout'));
        return httpService.$http.post(url, {}, config)
    };

    this.verifyToken = function() {
        var config = httpService.Utils.getHeader();
        var url = httpService.Utils.buildUrl(new Array('login', 'token'));
        return httpService.$http.get(url, config)
    };

    this.register = function(params) {
        var config = httpService.Utils.getHeader();
        var url = httpService.Utils.buildUrl(new Array('register'));
        return httpService.$http.post(url, params, config)
    };

    this.forgot = function(params) {
        var config = httpService.Utils.getHeader();
        var url = httpService.Utils.buildUrl(new Array('account', 'forgot'));
        return httpService.$http.post(url, params, config)
    };

    this.verifyKey = function(key) {
        var config = httpService.Utils.getHeader();
        var url = httpService.Utils.buildUrl(new Array('account', 'forgot', key));
        return httpService.$http.get(url, config)
    };

    this.verifyAccountRequest = function() {
        var config = httpService.Utils.getHeader();
        var url = httpService.Utils.buildUrl(new Array('account', 'verify'));
        return httpService.$http.post(url, {}, config)
    };

    this.verifyAccount = function(key) {
        var config = httpService.Utils.getHeader();
        var url = httpService.Utils.buildUrl(new Array('account', 'verify', key));
        return httpService.$http.get(url, config)
    };

    this.resetPassword = function(params) {
        var config = httpService.Utils.getHeader();
        var url = httpService.Utils.buildUrl(new Array('account', 'reset'));
        return httpService.$http.put(url, params, config)
    };

    this.getUser = function(id) {
        var config = httpService.Utils.getHeader();
        var url = httpService.Utils.buildUrl(new Array('users', id));
        return httpService.$http.get(url, config)
    };

    this.getUserSkills = function(id) {
        var config = httpService.Utils.getHeader();
        var url = httpService.Utils.buildUrl(new Array('users', id, 'skills'));
        return httpService.$http.get(url, config)
    };

    this.getUserGoals = function(id, options) {
        var config = httpService.Utils.getHeader();
        options = options || { offset: 0, limit: 20 }
        var url = httpService.Utils.buildUrl(new Array('users', id, 'goals'), options);
        return httpService.$http.get(url, config)
    };

    this.getUserPosts = function(id, options) {
        var config = httpService.Utils.getHeader();
        var options = options || httpService.defaultOffsetLimit;
        var url = httpService.Utils.buildUrl(new Array('users', id, 'activities'), options);
        //var url = httpService.Utils.buildUrl(new Array('ownfeed'));
        return httpService.$http.get(url, config)
    };

    this.getMyGoals = function(reqParams) {
        var config = httpService.Utils.getHeader();
        var _reqParams = reqParams || {}
            //var options = options || httpService.defaultOffsetLimit;
        var options = options || { offset: 0, limit: 10 };
        var url = httpService.Utils.buildUrl(new Array('mygoals'), _reqParams);
        return httpService.$http.get(url, config)
    };

    this.getMyGoalsLinks = function(id, queryParams) {
        var config = httpService.Utils.getHeader();
        var queryParams = queryParams || {}
        var url = httpService.Utils.buildUrl(new Array('mygoals', 'links', id), queryParams);
        return httpService.$http.get(url, config)
    };

    this.getUserInterests = function(id, params) {
        var config = httpService.Utils.getHeader();
        var options = params || {};
        var url = httpService.Utils.buildUrl(new Array('users', id, 'interest'), options);
        return httpService.$http.get(url, config)
    };

    this.addUserInterest = function(uid, id) {
        var config = httpService.Utils.getHeader();
        params = { tag_id: id }
        var url = httpService.Utils.buildUrl(new Array('users', uid, 'interest'));
        return httpService.$http.post(url, params, config)
    };

    this.removeUserInterest = function(uid, id) {
        var config = httpService.Utils.getHeader();
        var url = httpService.Utils.buildUrl(new Array('users', uid, 'interest', id));
        return httpService.$http.delete(url, config)
    };

    this.updateProfile = function(id, params) {
        var config = httpService.Utils.getHeader();
        var url = httpService.Utils.buildUrl(new Array('users', id, 'profile'));
        return httpService.$http.post(url, params, config)
    };

    this.validateUsernameEmail = function(params) {
        var config = httpService.Utils.getHeader();
        var url = httpService.Utils.buildUrl(new Array('account', 'validate'), params);
        return httpService.$http.post(url, params, config)
    };

    this.changeUsernameEmail = function(params) {
        var config = httpService.Utils.getHeader();
        var url = httpService.Utils.buildUrl(new Array('account', 'change'));
        return httpService.$http.put(url, params, config)
    };

    this.connections = function(id, queryParams) {
        var config = httpService.Utils.getHeader();
        var queryParams = queryParams || {}
        var url = httpService.Utils.buildUrl(new Array('users', id, 'connections'), queryParams);
        return httpService.$http.get(url, config)
    };

    this.getUserFollowers = function(id, queryParams) {
        var config = httpService.Utils.getHeader();
        var queryParams = queryParams || {}
        var url = httpService.Utils.buildUrl(new Array('users', id, 'connections', 'followers'), queryParams);
        return httpService.$http.get(url, config)
    };

    this.getUserFollowing = function(id, queryParams) {
        var config = httpService.Utils.getHeader();
        var queryParams = queryParams || {}
        var url = httpService.Utils.buildUrl(new Array('users', id, 'connections', 'followings'), queryParams);
        return httpService.$http.get(url, config)
    };

    this.getUserMutual = function(id, queryParams) {
        var config = httpService.Utils.getHeader();
        var queryParams = queryParams || {}
        var url = httpService.Utils.buildUrl(new Array('users', id, 'connections', 'mutual'), queryParams);
        return httpService.$http.get(url, config)
    };

    this.suggetedUsers = function(queryParams) {
        var config = httpService.Utils.getHeader();
        var queryParams = queryParams || {}
        var url = httpService.Utils.buildUrl(new Array('suggest', 'users'), queryParams);
        return httpService.$http.get(url, config)
    };

    this.changePassword = function(params) {
        var config = httpService.Utils.getHeader();
        var url = httpService.Utils.buildUrl(new Array('account', 'changepassword'));
        return httpService.$http.put(url, params, config)
    };

    this.changeProfileImage = function(uid, params) {
        console.log(params);
        var config = httpService.Utils.getHeader();
        var url = httpService.Utils.buildUrl(new Array('account', 'updateprofile'));
        return httpService.$http.put(url, params, config)
    };

    this.changeProfileCover = function(uid, params) {
        var config = httpService.Utils.getHeader();
        var url = httpService.Utils.buildUrl(new Array('account', 'updatecover'));
        return httpService.$http.put(url, params, config)
    };

    this.followUnfollowUser = function(id, isFollowing) {
        var config = httpService.Utils.getHeader();
        var url = httpService.Utils.buildUrl(new Array('users', id, 'follow'));
        if (isFollowing == 0) {
            return httpService.$http.post(url, {}, config)
        } else {
            return httpService.$http.delete(url, config)
        }
    };

    this.suggestedProfileImages = function() {
        var config = httpService.Utils.getHeader();
        var url = httpService.Utils.buildUrl(new Array('library', 'image'), { libraryof: "default_profile" });
        return httpService.$http.get(url, config)
    };

    this.suggestedCoverImages = function() {
        var config = httpService.Utils.getHeader();
        var url = httpService.Utils.buildUrl(new Array('library', 'image'), { libraryof: "default_cover" });
        return httpService.$http.get(url, config)
    };

    this.getActiveSession = function() {
        var config = httpService.Utils.getHeader();
        var url = httpService.Utils.buildUrl(new Array('account', 'sessions'));
        return httpService.$http.get(url, config)
    };

    this.revokeSession = function(id) {
        var config = httpService.Utils.getHeader();
        var url = httpService.Utils.buildUrl(new Array('account', 'sessions', id));
        return httpService.$http.delete(url, config)
    };

    this.getimages = function(uid, queryParams) {
        var config = httpService.Utils.getHeader();
        var queryParams = queryParams || {}
        var url = httpService.Utils.buildUrl(new Array('users', uid, 'images'), queryParams);
        return httpService.$http.get(url, config)
    };

    this.getBasicSettings = function() {
        var config = httpService.Utils.getHeader();
        var url = httpService.Utils.buildUrl(new Array('account', 'basic'));
        return httpService.$http.get(url, config)
    };

    this.muteUser = function(id) {
        var config = httpService.Utils.getHeader();
        var url = httpService.Utils.buildUrl(new Array('users', 'mute', id));
        return httpService.$http.post(url, {}, config)
    };

    this.unMuteUser = function(id) {
        var config = httpService.Utils.getHeader();
        var url = httpService.Utils.buildUrl(new Array('users', 'mute', id));
        return httpService.$http.delete(url, config)
    };

    this.getMutedUsers = function() {
        var config = httpService.Utils.getHeader();
        var url = httpService.Utils.buildUrl(new Array('users', 'mute', 'list'));
        return httpService.$http.get(url, config)
    };

    this.blockUser = function(id) {
        var config = httpService.Utils.getHeader();
        var url = httpService.Utils.buildUrl(new Array('users', 'block', id));
        return httpService.$http.post(url, {}, config)
    };

    this.unBlockUser = function(id) {
        var config = httpService.Utils.getHeader();
        var url = httpService.Utils.buildUrl(new Array('users', 'block', id));
        return httpService.$http.delete(url, config)
    };

    this.getBlockedUsers = function() {
        var config = httpService.Utils.getHeader();
        var url = httpService.Utils.buildUrl(new Array('users', 'block', 'list'));
        return httpService.$http.get(url, config)
    };

    this.deactivateAccount = function(params) {
        var config = httpService.Utils.getHeader();
        var url = httpService.Utils.buildUrl(new Array('account', 'deactivate'));
        return httpService.$http.put(url, params, config)
    };

    this.onBoardingDone = function() {
        var config = httpService.Utils.getHeader();
        var url = httpService.Utils.buildUrl(new Array('onboarding', 'done'));
        return httpService.$http.post(url, {}, config);
    };

    this.Education = Education;
    this.Work = Work;

}])



.service('GoalsDataServices', ['httpService', function(httpService) {

    this.getGoal = function(id) {
        var config = httpService.Utils.getHeader();
        var url = httpService.Utils.buildUrl(new Array('goals', id));
        return httpService.$http.get(url, config)
    };

    this.getContribuitons = function(id, options) {

        var config = httpService.Utils.getHeader();
        var options = options || httpService.defaultOffsetLimit;
        var url = httpService.Utils.buildUrl(new Array('goals', id, 'contributions'), options);
        return httpService.$http.get(url, config)
    };

    this.updateGoal = function(id, params) {
        var config = httpService.Utils.getHeader();
        var url = httpService.Utils.buildUrl(new Array('goals', id));
        return httpService.$http.put(url, params, config)
    };

    this.deletGoal = function(id) {
        var url = httpService.Utils.buildUrl(new Array('goals', id));
        return httpService.$http.delete(url, config);
    };

    this.postContribution = function(id, params) {
        var config = httpService.Utils.getHeader();
        var params = params || {};
        var url = httpService.Utils.buildUrl(new Array('goals', id, 'contributions'));
        return httpService.$http.post(url, params, config)
    };

    this.getLinkedGoals = function(id, options) {
        var config = httpService.Utils.getHeader();
        var options = options || httpService.defaultOffsetLimit;
        var url = httpService.Utils.buildUrl(new Array('goals', id, 'linked-goals'), options);
        return httpService.$http.get(url, config)
    };

    this.getMilestones = function(id) {
        var config = httpService.Utils.getHeader();
        var url = httpService.Utils.buildUrl(new Array('goals', id, 'milestones'));
        return httpService.$http.get(url, config)
    };

    this.getGoalFeed = function(id, options) {
        var config = httpService.Utils.getHeader();
        var options = options || httpService.defaultOffsetLimit;
        var url = httpService.Utils.buildUrl(new Array('goals', id, 'feed'), options);
        return httpService.$http.get(url, config)
    };

    this.getLinkedGoalsFeed = function(id, options) {
        var config = httpService.Utils.getHeader();
        var options = options || httpService.defaultOffsetLimit;
        var url = httpService.Utils.buildUrl(new Array('goals', id, 'linked-feed'), options);
        return httpService.$http.get(url, config)
    };

    this.postMilestone = function(id, params) {
        var config = httpService.Utils.getHeader();
        var url = httpService.Utils.buildUrl(new Array('goals', id, 'milestones'));
        var params = params || {};
        return httpService.$http.post(url, params, config)
    };

    this.deleteMilestone = function(id) {
        var config = httpService.Utils.getHeader();
        var url = httpService.Utils.buildUrl(new Array('goals', 'milestone', id));
        return httpService.$http.delete(url, config)
    };


    this.getProgress = function(id) {
        var config = httpService.Utils.getHeader();
        var url = httpService.Utils.buildUrl(new Array('goals', id, 'progress'));
        return httpService.$http.get(url, config)
    };

    this.goalFollowSuggestion = function(options) {
        var config = httpService.Utils.getHeader();
        var options = options || httpService.defaultOffsetLimit;
        var url = httpService.Utils.buildUrl(new Array('goals', 'follow', 'suggestion'), options);
        return httpService.$http.get(url, config)
    };

    this.postProgress = function(id, params) {
        var config = httpService.Utils.getHeader();
        var url = httpService.Utils.buildUrl(new Array('goals', id, 'progress'));
        var params = params || {};
        return httpService.$http.post(url, params, config)
    };

    this.followUnfollow = function(id, isFollowing) {
        var config = httpService.Utils.getHeader();
        var url = httpService.Utils.buildUrl(new Array('goals', id, 'follow'));
        if (isFollowing == 0) {
            return httpService.$http.post(url, {}, config)
        } else {
            return httpService.$http.delete(url, config)
        }
    };

    /**
     * Link and unlink goals.
     * @method
     * @param {string} id - Other goal id
     * @param {string} to_id - Owner goal id.
     */
    this.linkUnlink = function(id, to_id, isLinker) {
        var config = httpService.Utils.getHeader();
        var url = httpService.Utils.buildUrl(new Array('goals', id, 'link'));
        if (isLinker == 0) {
            return httpService.$http.post(url, { fromGoalId: to_id }, config)
        } else {
            return httpService.$http.delete(url, { params: { fromGoalId: to_id }, headers: config.headers })
        }
    };


    this.createGoal = function(params) {
        var config = httpService.Utils.getHeader();
        var params = params || {}
        var url = httpService.Utils.buildUrl(new Array('goals'));
        return httpService.$http.post(url, params, config)
    };

    this.achieve = function(id, params) {
        var config = httpService.Utils.getHeader();
        var url = httpService.Utils.buildUrl(new Array('goals', id, "achieve"));
        return httpService.$http.put(url, params, config);
    };

    this.motivate = function(id, me) {
        var config = httpService.Utils.getHeader();
        var url = httpService.Utils.buildUrl(new Array('goals', id, 'motivation'));
        if (me == 0) {
            return httpService.$http.post(url, {}, config)
        } else {
            return httpService.$http.delete(url, {}, config)
        }
    };

    this.getFollowers = function(id, params) {
        var config = httpService.Utils.getHeader();
        var url = httpService.Utils.buildUrl(new Array('goals', id, 'followers'), params);
        return httpService.$http.get(url, config)
    };

    this.getLinkers = function(id) {
        var config = httpService.Utils.getHeader();
        var url = httpService.Utils.buildUrl(new Array('goals', id, 'linkers'));
        return httpService.$http.get(url, config)
    };

    this.getMotivators = function(id) {
        var config = httpService.Utils.getHeader();
        var url = httpService.Utils.buildUrl(new Array('goals', id, 'motivators'));
        return httpService.$http.get(url, config)
    };

    this.suggestedImages = function() {
        var config = httpService.Utils.getHeader();
        var url = httpService.Utils.buildUrl(new Array('library', 'image'), { libraryof: "default_goal" });
        return httpService.$http.get(url, config)
    };

    this.changeImage = function(id, params) {
        var config = httpService.Utils.getHeader();
        var url = httpService.Utils.buildUrl(new Array('goals', id, 'updatecover'));
        return httpService.$http.put(url, params, config)
    };

    this.getImages = function(id, options) {
        var config = httpService.Utils.getHeader();
        var params = options || {};
        var url = httpService.Utils.buildUrl(new Array('goals', id, 'images'), params);
        return httpService.$http.get(url, config)
    };

    this.muteGoal = function(id) {
        var config = httpService.Utils.getHeader();
        var url = httpService.Utils.buildUrl(new Array('goals', 'mute', id));
        return httpService.$http.post(url, {}, config)
    };

    this.unMuteGoal = function(id) {
        var config = httpService.Utils.getHeader();
        var url = httpService.Utils.buildUrl(new Array('goals', 'mute', id));
        return httpService.$http.delete(url, config)
    };

    this.getMutedGoals = function() {
        var config = httpService.Utils.getHeader();
        var url = httpService.Utils.buildUrl(new Array('goals', 'mute', 'list'));
        return httpService.$http.get(url, config)
    };

    this.linkedGoalList = function(id, params) {
        var config = httpService.Utils.getHeader();
        var url = httpService.Utils.buildUrl(new Array('goals', id, 'linked-goals-me'));
        return httpService.$http.get(url, config)
    };

    this.userConnections = function(name, options) {
        queryParams = { q: name, offset: options.offset, limit: options.limit }
        var url = httpService.Utils.buildUrl(new Array('search', 'user', 'connections'), queryParams);
        return httpService.$http.get(url, config);
    };

}])

.service('FindFriends', ['httpService', function(httpService) {

    this.getWhoAreNotOnLinkagoal = function(provider) {
        var config = httpService.Utils.getHeader();
        var url = httpService.Utils.buildUrl(new Array('contacts', 'invite'), { provider: provider });
        return httpService.$http.get(url, config)
    };

    this.getWhoAreOnLinkagoal = function(provider) {
        var config = httpService.Utils.getHeader();
        var url = httpService.Utils.buildUrl(new Array('contacts', 'find'), { provider: provider });
        return httpService.$http.get(url, config)
    };

    this.followMultiple = function(ids, feedCount) {
        var config = httpService.Utils.getHeader();
        var url = httpService.Utils.buildUrl(new Array('users', 'friendship','follow-multiple'), {feedLimit: feedCount});
        return httpService.$http.post(url, {follower_ids: ids}, config)
    };

    this.invite = function(ids) {
        var ids = ids || [];
        var config = httpService.Utils.getHeader();
        var url = httpService.Utils.buildUrl(new Array('contacts', 'invite'));
        return httpService.$http.post(url, {contact_ids: ids}, config)
    };

}])

.service('FeedbackService', ['httpService', function(httpService) {

    this.submit = function(params) {
        var config = httpService.Utils.getHeader();
        var url = httpService.Utils.buildUrl(new Array('feedback'));
        return httpService.$http.post(url, params, config);
    };

}])

.service('FileService', ['httpService', 'Upload', '$q', function(httpService, Upload, $q, $rootScope) {
    var FileService = {};
    var _type = "";

    this.setType = function(type) {
        _type = type;
    };

    this.cropImage = function(id, params) {
        var config = httpService.Utils.getHeader();
        var newParams = {}

        newParams.attach_id = id;
        newParams.x = parseInt(params.x);
        newParams.y = parseInt(params.y);
        newParams.width = parseInt(params.width);
        newParams.height = parseInt(params.height);
        newParams.rotation = params.rotate;
        config.headers["Content-Type"] = 'application/json';
        var url = httpService.Utils.buildUrl(new Array('image', 'crop'), false, true);
        return httpService.$http.post(url, newParams, config)
    };

    this.uploadFile = function(files, fileType) {
        var config = httpService.Utils.getHeader();
        var _fileType = fileType || "image";
        if (_fileType == "video") {
            _req = "video"
            _queryParam = { videoof: _type }
        } else if (_fileType == "image") {
            _req = "image"
            _queryParam = { imageof: _type }
        }
        var files = files || false
        if (files == false) return true;
        var deferred = $q.defer();
        var url = httpService.Utils.buildUrl(new Array('upload', _req), _queryParam, true);
        Upload.upload({ url: url, data: { uploadfile: files }, headers: config.headers }).then(function(resp) {
            deferred.resolve(resp);
        }, function(resp) {
            deferred.reject(resp);
        }, function(evt) {
            files.progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
        });
        return deferred.promise;
    };

}])

.service('UrlService', ['httpService', function(httpService) {

    this.fetch = function(url) {
        var config = httpService.Utils.getHeader();
        var requestUrl = httpService.Utils.buildUrl(new Array('fetch'), {}, true);
        var params = { url: url } || {};
        return httpService.$http.post(requestUrl, params, config)
    };
}]);


angular.module('CoreApiUtilities', [])

.factory('Utils', ['lagConfig', 'localStorageService', function(lagConfig, localStorageService) {

    var makeHeader = function() {
        var sessionUser = localStorageService.get('loggedInUser');
        if (sessionUser != null) {
            return config = {
                headers: {
                    'x-client-id': sessionUser.credentials.client_id,
                    'token': sessionUser.credentials.token,
                    'x-api-signature': '',
                    "x-api-version": "1.0"
                }
            };
        } else {
            return config = {
                headers: { "x-api-version": "1.0" }
            };
        }
    }

    var defaultOffsetLimit = { offset: 0, limit: 5 }

    var buildUrl = function(urlSet, queryStringSet, isFileServer) {
        var isFileServer = isFileServer || false;
        queryStringSet = queryStringSet || false;

        if (!isFileServer) {
            var url = lagConfig.apiUrl;
        } else {
            var url = lagConfig.fileApi;
        }

        if (Object.prototype.toString.call(urlSet) === '[object Array]') {
            url += urlSet.toURL();
        }

        if (queryStringSet !== false) {
            url += '?' + toQueryString(queryStringSet);
        }
        return url;
    }

    return {
        getHeader: makeHeader,
        buildUrl: buildUrl,
        defaultOffsetLimit: defaultOffsetLimit
    };
}])
;LinkagoalWebApp.factory('Explore', function(ExploreServices, $timeout) {
  var Explore =  function() {
    this.items = [];
    this.disabled = false;
    this.offset = 0;
    this.limit = 6;
  };

  Explore.prototype.hotNewGoals = function() {
    if (this.disabled) return;
    this.disabled = true;
    ExploreServices.hotNewGoals({offset:this.offset, limit:this.limit}).success(function(res){
      this.items = this.items.concat(res.data.goals)
      if (res.data.goals.length < this.limit) {
        this.disabled = true;
      } else {
        this.disabled = false;
      }
      this.offset = this.offset + this.limit;
    }.bind(this));
  };

  Explore.prototype.popularGoals = function() {
    if (this.disabled) return;
    this.disabled = true;
    ExploreServices.popularGoals({offset:this.offset, limit:this.limit}).success(function(res){
      this.items = this.items.concat(res.data.goals)
      if (res.data.goals.length < this.limit) {
        this.disabled = true;
      } else {
        this.disabled = false;
      }
      this.offset = this.offset + this.limit;
    }.bind(this));
  };

  Explore.prototype.featuredUsers = function() {
    if (this.disabled) return;
    this.disabled = true;
    ExploreServices.featuredUsers({offset:this.offset, limit:this.limit}).success(function(res){
      this.items = this.items.concat(res.data.users)
      if (res.data.users.length < this.limit) {
        this.disabled = true;
      } else {
        this.disabled = false;
      }
      this.offset = this.offset + this.limit;
    }.bind(this));
  };

  return Explore;
});;LinkagoalWebApp.factory('Goals', function(GoalsDataServices, $timeout) {
  var Goals =  function(id) {
    this.items = [];
    this.disabled = false;
    this.offset = 0;
    this.limit = 10;
    this.id = id || 0;
  };

  Goals.prototype.feeds = function() {
    if (this.disabled) return;
    this.disabled = true;
    GoalsDataServices.getGoalFeed(this.id, {offset:this.offset, limit:this.limit}).success(function(res){
      this.items = this.items.concat(res.data)
      if (res.data.length < this.limit) {
        this.disabled = true;
      } else {
        $timeout(function(){
          this.disabled = false;
        }, 50);
      }
      this.offset = this.offset + this.limit;
    }.bind(this));
  };

  Goals.prototype.linkFeeds = function() {
    if (this.disabled) return;
    this.disabled = true;
    GoalsDataServices.getLinkedGoalsFeed(this.id, {offset:this.offset, limit:this.limit}).success(function(res){
      this.items = this.items.concat(res.data)
      if (res.data.length < this.limit) {
        this.disabled = true;
      } else {
        $timeout(function(){
          this.disabled = false;
        }, 50);
      }
      this.offset = this.offset + this.limit;
    }.bind(this));
  };

  Goals.prototype.addNewFeed = function(feed) {
    this.items.unshift(feed);
  }

  Goals.prototype.deleteFeed = function(index) {
    this.items.splice(index,1);
  }

  return Goals;
});;LinkagoalWebApp.factory('Search', function($timeout, SearchDataServices) {
  var Search = function() {
    this.items = [];
    this.disabled = false;
    this.offset = 0;
    this.limit = 10;
  };

  Search.prototype.users = function(query) {
    if (this.disabled) return;
    this.disabled = true;
    SearchDataServices.users(query, {offset:this.offset, limit:this.limit}).success(function(res){
      this.items = this.items.concat(res.data)
      if (res.data.length < this.limit) {
        this.disabled = true;
      } else {
        $timeout(function(){
          this.disabled = false;
        }, 100);
      }
      this.offset = this.offset + this.limit;
    }.bind(this));
  };

  Search.prototype.goals = function(query) {
    if (this.disabled) return;
    this.disabled = true;
    SearchDataServices.goals(query, {offset:this.offset, limit:this.limit}).success(function(res){
      this.items = this.items.concat(res.data)
      if (res.data.length < this.limit) {
        this.disabled = true;
      } else {
        $timeout(function(){
          this.disabled = false;
        }, 100);
      }
      this.offset = this.offset + this.limit;      
    }.bind(this));
  };

  Search.prototype.tags = function(query) {
    if (this.disabled) return;
    this.limit = 50;
    this.disabled = true;
    SearchDataServices.tags(query, {offset:this.offset, limit:this.limit}).success(function(res){
      this.items = this.items.concat(res.data)
      if (res.data.length < this.limit) {
        this.disabled = true;
      } else {
        //$timeout(function(){
          this.disabled = false;
        //}, 100);
      }
      this.offset = this.offset + this.limit;
    }.bind(this));
  };

  Search.prototype.miniSearch = function(query) {
    SearchDataServices.tags(query, {offset:this.offset, limit:this.limit}).success(function(res){
      this.items = this.items.concat(res.data)
    }.bind(this));
  }

  return Search;
});;LinkagoalWebApp.factory('Users', function($timeout) {
  var Users =  function() {
    this.items = [];
    this.disabled = false;
    this.offset = 0;
    this.limit = 10;
  };
  return Users;
});;LinkagoalWebApp.filter('orderByDayNumber', function() {
  return function(items, field, reverse) {
    var filtered = [];
    angular.forEach(items, function(item) {
      filtered.push(item);
    });
    filtered.sort(function (a, b) {
      return (a[field] > b[field] ? 1 : -1);
    });
    if(reverse) filtered.reverse();
    return filtered;
  };
});;// 'use strict';
// var loggingModule = angular.module('services.logging', []);


// /**
//  * Override Angular's built in exception handler, and tell it to 
//  * use our new exceptionLoggingService which is defined below
//  */
// loggingModule.provider(
//     "$exceptionHandler",{
//         $get: function(exceptionLoggingService){
//             return(exceptionLoggingService);
//         }
//     }
// );

// /**
//  * Exception Logging Service, currently only used by the $exceptionHandler
//  * it preserves the default behaviour ( logging to the console) but 
//  * also posts the error server side after generating a stacktrace.
//  */
// loggingModule.factory("exceptionLoggingService",["$log","$window", function($log, $window){
//     function error(exception, cause){

//         // preserve the default behaviour which will log the error
//         // to the console, and allow the application to continue running.
//         $log.error.apply($log, arguments);

//         // now try to log the error to the server side.
//         try{
//             var errorMessage = exception.toString();

//             // use our traceService to generate a stack trace
//             var stackTrace = StackTrace.get().then(function(stackframes){
//                 var stringifiedStack = stackframes.map(function(sf) {
//                         return sf.toString();
//                     }).join('\n');
//                 $.ajax({
//                     type: "POST",
//                     url: "/logger", 
//                     contentType: "application/json",
//                     data: angular.toJson({
//                         url: $window.location.href,
//                         message: errorMessage,
//                         type: "exception",
//                         stackTrace: stringifiedStack,
//                         cause: ( cause || "")
//                     })
//                 });
//             })

//             // using jQuery AJAX not an angular service such as $http 
            
//         } catch (loggingError){
//             $log.warn("Error Client-side logging failed");
//             $log.log(loggingError);
//         }
//     }
//     return(error);
// }]);
// 
// 
// 




LinkagoalWebApp.config(['$provide', function($provide) {
    $provide.decorator('$log', ['$delegate', 'Logging', function($delegate, Logging) {
    Logging.enabled = true;
    var methods = {
      error: function() {
        if (Logging.enabled) {
          $delegate.error.apply($delegate, arguments);
          Logging.error.apply(null, arguments);
        }
      },
      log: function() {
        if (Logging.enabled) {
          $delegate.log.apply($delegate, arguments);
          Logging.log.apply(null, arguments);
        }
      },
      info: function() {
        if (Logging.enabled) {
          $delegate.info.apply($delegate, arguments);
          Logging.info.apply(null, arguments);
        }
      },
      warn: function() {
        if (Logging.enabled) {
          $delegate.warn.apply($delegate, arguments);
          Logging.warn.apply(null, arguments);
        }
      }
    };
    return methods;
  }]);
}]);

LinkagoalWebApp.service('Logging', function($injector, $window) {

  var service = {
    error: function() {
      self.type = 'error';
      log.apply(self, arguments);
    },
    warn: function() {
      self.type = 'warn';
      log.apply(self, arguments);
    },
    info: function() {
      self.type = 'info';
      log.apply(self, arguments);
    },
    log: function() {
      self.type = 'log';
      log.apply(self, arguments);
    },
    enabled: false,
    logs: []
  };

  var log = function() {

    args = [];
    if (typeof arguments === 'object') {
      for(var i = 0; i < arguments.length; i++ ) {
        arg = arguments[i];
        var exception = {};
        exception.message = arg.message;
        exception.stack = arg.stack;
        args.push(exception);

      }
    }
    
    var eventLogDateTime = new Date().toString();

    var json = angular.toJson({
        url: $window.location.href,
        time: eventLogDateTime,
        items: args,
        type: type,
    });
    console.log(json);

    //console.log('Custom logger [' + logItem.time + '] ' + logItem.message.toString());
    //service.logs.push(logItem);
  };


  return service;

});

LinkagoalWebApp.controller('loggingController', ['$scope', '$log', function($scope, $log) {
  $scope.$log = $log;

  $scope.throwError = function() {
    functionThatThrows();
  };

  $scope.throwException = function() {
    throw {
      message: 'error message'
    };
  };

  $scope.throwNestedException = function() {
    functionThrowsNestedExceptions();
  };

  functionThatThrows = function() {
    var x = y;
  };

  functionThrowsNestedExceptions = function() {
    try {
      var a = b;
    } catch (e) {
      try {
        var c = d;
      } catch (ex) {
        $log.error(e, ex);
      }
    }
  };
}]);;var $window = $(window), previousScrollTop = 0, scrollLock = false;
$window.scroll(function(event) {   
    if(scrollLock) {
        $window.scrollTop(previousScrollTop); 
    }
    previousScrollTop = $window.scrollTop();
});
;'use strict';

var _slicedToArray = (function() {
    function sliceIterator(arr, i) {
        var _arr = [];
        var _n = true;
        var _d = false;
        var _e = undefined;
        try {
            for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value);
                if (i && _arr.length === i) break; } } catch (err) { _d = true;
            _e = err; } finally {
            try {
                if (!_n && _i['return']) _i['return'](); } finally {
                if (_d) throw _e; } }
        return _arr; }
    return function(arr, i) {
        if (Array.isArray(arr)) {
            return arr; } else if (Symbol.iterator in Object(arr)) {
            return sliceIterator(arr, i); } else {
            throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

angular.module('ui.mention', []).directive('uiMention', function() {
    return {
        require: ['ngModel', 'uiMention'],
        controller: 'uiMention',
        controllerAs: '$mention',
        link: function link($scope, $element, $attrs, _ref) {
            var _ref2 = _slicedToArray(_ref, 2);

            var ngModel = _ref2[0];
            var uiMention = _ref2[1];

            uiMention.init(ngModel);
        }
    };
});
'use strict';

angular.module('ui.mention').controller('uiMention', ["$element", "$scope", "$attrs", "$q", "$timeout", "$document", function($element, $scope, $attrs, $q, $timeout, $document) {
    var _this2 = this;

    // Beginning of input or preceeded by spaces: @sometext
    this.pattern = this.pattern || /(?:\s+|^)@(\w+(?: \w+)?)$/;
    this.$element = $element;
    this.choices = [];
    this.mentions = [];
    var ngModel;

    /**
     * $mention.init()
     *
     * Initializes the plugin by setting up the ngModelController properties
     *
     * @param  {ngModelController} model
     */
    this.init = function(model) {
        var _this = this;

        // Leading whitespace shows up in the textarea but not the preview
        $attrs.ngTrim = 'false';

        ngModel = model;

        ngModel.$parsers.push(function(value) {
            // Removes any mentions that aren't used
            _this.mentions = _this.mentions.filter(function(mention) {
                if (~value.indexOf(_this.label(mention))) return value = value.replace(_this.label(mention), _this.encode(mention));
            });

            _this.render(value);

            return value;
        });

        ngModel.$formatters.push(function() {
            var value = arguments.length <= 0 || arguments[0] === undefined ? '' : arguments[0];

            // In case the value is a different primitive
            value = value.toString();

            // Removes any mentions that aren't used
            _this.mentions = _this.mentions.filter(function(mention) {
                if (~value.indexOf(_this.encode(mention))) {
                    value = value.replace(_this.encode(mention), _this.label(mention));
                    return true;
                } else {
                    return false;
                }
            });

            return value;
        });

        ngModel.$render = function() {
            $element.val(ngModel.$viewValue || '');
            $timeout(_this.autogrow, true);
            _this.render();
        };
    };

    /**
     * $mention.render()
     *
     * Renders the syntax-encoded version to an HTML element for 'highlighting' effect
     *
     * @param  {string} [text] syntax encoded string (default: ngModel.$modelValue)
     * @return {string}        HTML string
     */
    this.render = function() {
        var html = arguments.length <= 0 || arguments[0] === undefined ? ngModel.$modelValue : arguments[0];

        html = (html || '').toString();
        _this2.mentions.forEach(function(mention) {
            html = html.replace(_this2.encode(mention), _this2.highlight(mention));
        });
        $element.next().html(html);
        return html;
    };

    /**
     * $mention.highlight()
     *
     * Returns a choice in HTML highlight formatting
     *
     * @param  {mixed|object} choice The choice to be highlighted
     * @return {string}              HTML highlighted version of the choice
     */
    this.highlight = function(choice) {
        return '<span>' + this.label(choice) + '</span>';
    };

    /**
     * $mention.decode()
     *
     * @note NOT CURRENTLY USED
     * @param  {string} [text] syntax encoded string (default: ngModel.$modelValue)
     * @return {string}        plaintext string with encoded labels used
     */
    this.decode = function() {
        var value = arguments.length <= 0 || arguments[0] === undefined ? ngModel.$modelValue : arguments[0];

        return value ? value.replace(/@\[([\s\w]+):[0-9a-z-]+\]/gi, '$1') : '';
    };

    /**
     * $mention.label()
     *
     * Converts a choice object to a human-readable string
     *
     * @param  {mixed|object} choice The choice to be rendered
     * @return {string}              Human-readable string version of choice
     */
    this.label = function(choice) {
        return choice.name
    };

    /**
     * $mention.encode()
     *
     * Converts a choice object to a syntax-encoded string
     *
     * @param  {mixed|object} choice The choice to be encoded
     * @return {string}              Syntax-encoded string version of choice
     */
    this.encode = function(choice) {
        return '@['+ choice.id + ':' + this.label(choice)+']';
        //return '@['+ choice.id '+  ' + ':'  ']';
    };

    /**
     * $mention.replace()
     *
     * Replaces the trigger-text with the mention label
     *
     * @param  {mixed|object} mention  The choice to replace with
     * @param  {regex.exec()} [search] A regex search result for the trigger-text (default: this.searching)
     * @param  {string} [text]         String to perform the replacement on (default: ngModel.$viewValue)
     * @return {string}                Human-readable string
     */
    this.replace = function(mention) {
        var search = arguments.length <= 1 || arguments[1] === undefined ? this.searching : arguments[1];
        var text = arguments.length <= 2 || arguments[2] === undefined ? ngModel.$viewValue : arguments[2];

        // TODO: come up with a better way to detect what to remove
        // TODO: consider alternative to using regex match
        text = text.substr(0, search.index + search[0].indexOf('@')) + this.label(mention) + ' ' + text.substr(search.index + search[0].length);
        return text;
    };

    /**
     * $mention.select()
     *
     * Adds a choice to this.mentions collection and updates the view
     *
     * @param  {mixed|object} [choice] The selected choice (default: activeChoice)
     */
    this.select = function() {
        var choice = arguments.length <= 0 || arguments[0] === undefined ? this.activeChoice : arguments[0];

        // Add the mention
        this.mentions.push(choice);

        // Replace the search with the label
        ngModel.$setViewValue(this.replace(choice));

        // Close choices panel
        this.cancel();

        // Update the textarea
        ngModel.$render();
    };

    /**
     * $mention.up()
     *
     * Moves this.activeChoice up the this.choices collection
     */
    this.up = function() {
        var index = this.choices.indexOf(this.activeChoice);
        if (index > 0) {
            this.activeChoice = this.choices[index - 1];
        } else {
            this.activeChoice = this.choices[this.choices.length - 1];
        }
    };

    /**
     * $mention.down()
     *
     * Moves this.activeChoice down the this.choices collection
     */
    this.down = function() {
        var index = this.choices.indexOf(this.activeChoice);
        if (index < this.choices.length - 1) {
            this.activeChoice = this.choices[index + 1];
        } else {
            this.activeChoice = this.choices[0];
        }
    };

    /**
     * $mention.search()
     *
     * Searches for a list of mention choices and populates
     * $mention.choices and $mention.activeChoice
     *
     * @param  {regex.exec()} match The trigger-text regex match object
     * @todo Try to avoid using a regex match object
     */
    this.search = function(match) {
        var _this3 = this;

        this.searching = match;

        return $q.when(this.findChoices(match, this.mentions)).then(function(choices) {
            _this3.choices = choices;
            _this3.activeChoice = choices[0];
            return choices;
        });
    };

    /**
     * $mention.findChoices()
     *
     * @param  {regex.exec()} match    The trigger-text regex match object
     * @todo Try to avoid using a regex match object
     * @todo Make it easier to override this
     * @return {array[choice]|Promise} The list of possible choices
     */
    this.findChoices = function(match, mentions) {
        return [];
    };

    /**
     * $mention.cancel()
     *
     * Clears the choices dropdown info and stops searching
     */
    this.cancel = function() {
        this.choices = [];
        this.searching = null;
    };

    this.autogrow = function() {
        $element[0].style.height = 0; // autoshrink - need accurate scrollHeight
        var style = getComputedStyle($element[0]);
        if (style.boxSizing == 'border-box') $element[0].style.height = $element[0].scrollHeight + 'px';
    };

    // Interactions to trigger searching
    $element.on('keyup click focus', function(event) {
        // If event is fired AFTER activeChoice move is performed
        if (_this2.moved) return _this2.moved = false;
        // Don't trigger on selection
        if ($element[0].selectionStart != $element[0].selectionEnd) return;
        var text = $element.val();
        // text to left of cursor ends with `@sometext`
        var match = _this2.pattern.exec(text.substr(0, $element[0].selectionStart));
        if (match) {
            _this2.search(match);
        } else {
            _this2.cancel();
        }

        $scope.$apply();
    });

    $element.on('keydown', function(event) {
        if (!_this2.searching) return;

        switch (event.keyCode) {
            case 13:
                // return
                _this2.select();
                break;
            case 38:
                // up
                _this2.up();
                break;
            case 40:
                // down
                _this2.down();
                break;
            default:
                // Exit function
                return;
        }

        _this2.moved = true;
        event.preventDefault();

        $scope.$apply();
    });

    this.onMouseup = (function(event) {
        var _this4 = this;

        if (event.target == $element[0]) return;

        $document.off('mouseup', this.onMouseup);

        if (!this.searching) return;

        // Let ngClick fire first
        $scope.$evalAsync(function() {
            _this4.cancel();
        });
    }).bind(this);

    $element.on('focus', function(event) {
        $document.on('mouseup', _this2.onMouseup);
    });

    // Autogrow is mandatory beacuse the textarea scrolls away from highlights
    $element.on('input', this.autogrow);
    // Initialize autogrow height
    $timeout(this.autogrow, true);
}]);
;LinkagoalWebApp.directive('embeddedUrl', function(UrlService, $compile) {
    var template = '<div class="lg-card-link-main" ng-if="crawledUrl.link">' +
        '<div class="lg-r-align"><span class="url-discard" ng-click="crawledUrl.remove()">Discard</span></div>' +
        '<div class="lg-relative lg-br-all" ng-if="crawledUrl.link.image.medium">' +
        '<img ng-src="{{crawledUrl.link.image.medium.source}}" alt="" /></div>' +
        '<div class="lg-card-link-box lg-white-bg">' +
        '<a rel="nofollow" href="{{crawledUrl.link.url}}" class="lg-card-link">{{crawledUrl.link.title}} | {{crawledUrl.link.host}}</a>' +
        '<div class="lg-card-link-caption">{{crawledUrl.link.description | limitTo:200 }}</div>' +
        '</div></div>';

    return {
        restrict: 'A',
        scope: {
            ngModel: '=',
            urlInputBox: '=urlInputBox',
            crawledUrl: '=crawledUrl'
        },
        link: function(scope, elem, attr) {
            var urlRegEx = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?|((?:www)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-]*)?\??(?:[\-\+=&;%@\.\w]*)#?(?:[\.\!\/\\\w]*)) /g;

            //var urlRegEx = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*) /g;
            // scope.$watch('urlInputBox', function(newValue, oldValue) {
            //     if ((typeof newValue != "undefined")) {
            //         if (newValue.length > 1) {
            //             // var urlRegEx = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-]*)?\??(?:[\-\+=&;%@\.\w]*)#?(?:[\.\!\/\\\w]*))?)/g;
            //             var urltext = newValue.match(urlRegEx) || [];
            //             var urlFetched = { isfetched: false, link: urltext[0] }
            //             var fetchedURLs = scope.crawledUrl.fetchedURLs = [];

            //             //Skip Duplicates URL FROM TEXT
            //             var flag = false;
            //             for (var i = 0; i < urltext.length; i++) {

            //                 flag = true;
            //                 for (var j = 0; j < fetchedURLs.length; j++) {
            //                     if (urltext[i] == fetchedURLs[j].link) {
            //                         flag = false;
            //                         break;
            //                     }
            //                 }
            //                 if (flag) {
            //                     fetchedURLs.push({ isfetched: false, link: urltext[i] });
            //                 }
            //             }
            //             elem.bind("keydown keypress", function(event) {
            //                 console.log(urltext[0])
            //                 if (event.keyCode == 32 && urltext[0] != undefined) {
            //                     //for (var i = 0; i == 0; i++) {
            //                     if (fetchedURLs[i].isfetched == false) {
            //                         UrlService.fetch(fetchedURLs[i].link).success(function(res) {
            //                             if (res.data.length == 0) {
            //                                 delete fetchedURLs[i];
            //                             } else {
            //                                 scope.crawledUrl.fetched_url_id = res.data.id;
            //                                 scope.crawledUrl.link = res.data;
            //                                 var content = $compile(template)(scope);
            //                                 elem.parent().append(content);
            //                             }

            //                         })

            //                         fetchedURLs[i].isfetched = true;
            //                     }
            //                     //}
            //                 }


            //             })

            //         }
            //     } else { scope.crawledUrl.hint = false; }
            // });

            var isFetched = false;
            var urltext = [];  
            elem.bind("keypress", function(event) {
                if (scope.urlInputBox != undefined)
                urltext = scope.urlInputBox.match(urlRegEx);
                if ((event.keyCode == 32) && (urltext != null) && (isFetched == false)) {
                    UrlService.fetch(urltext[0]).success(function(res) {
                        if (res.data.length == 0) {
                            //delete urltext[i];
                        } else {
                            scope.crawledUrl.fetched_url_id = res.data.id;
                            scope.crawledUrl.link = res.data;
                            var content = $compile(template)(scope);
                            elem.parent().append(content);
                            isFetched = true;
                        }

                    })
                }
            })
            scope.crawledUrl.remove = function() {
                delete scope.crawledUrl.fetched_url_id;
                delete scope.crawledUrl.link;
                isFetched = true;
                //scope.$destroy();
            }

            // cleanUp = function() {
            //     $('.lg-cont-media').remove();
            // };
            // scope.$on('$destroy', cleanUp);
        }
    };
});
;LinkagoalWebApp.directive('messageDocker', [function () {
	return {
		restrict: 'A',
		templateUrl: 'partials/sub-partials/message_docker.tmpl',
		link: function (scope, iElement, iAttrs) {
			
		}
	};
}]);;(function (root, factory) {
  if(typeof define === 'function' && define.amd) {
    define(['video.js'], function(videojs){
      return (root.Youtube = factory(videojs));
    });
  } else if(typeof module === 'object' && module.exports) {
    module.exports = (root.Youtube = factory(require('video.js')));
  } else {
    root.Youtube = factory(root.videojs);
  }
}(this, function(videojs) {
  'use strict';

  var Tech = videojs.getComponent('Tech');

  var Youtube = videojs.extend(Tech, {

    constructor: function(options, ready) {
      Tech.call(this, options, ready);

      this.setPoster(options.poster);
      this.setSrc(this.options_.source, true);

      // Set the vjs-youtube class to the player
      // Parent is not set yet so we have to wait a tick
      setTimeout(function() {
        this.el_.parentNode.className += ' vjs-youtube';

        if (_isOnMobile) {
          this.el_.parentNode.className += ' vjs-youtube-mobile';
        }

        if (Youtube.isApiReady) {
          this.initYTPlayer();
        } else {
          Youtube.apiReadyQueue.push(this);
        }
      }.bind(this));
    },

    dispose: function() {
      this.el_.parentNode.className = this.el_.parentNode.className
        .replace(' vjs-youtube', '')
        .replace(' vjs-youtube-mobile', '');
    },

    createEl: function() {
      var div = document.createElement('div');
      div.setAttribute('id', this.options_.techId);
      div.setAttribute('style', 'width:100%;height:100%;top:0;left:0;position:absolute');

      var divWrapper = document.createElement('div');
      divWrapper.appendChild(div);

      if (!_isOnMobile && !this.options_.ytControls) {
        var divBlocker = document.createElement('div');
        divBlocker.setAttribute('class', 'vjs-iframe-blocker');
        divBlocker.setAttribute('style', 'position:absolute;top:0;left:0;width:100%;height:100%');

        // In case the blocker is still there and we want to pause
        divBlocker.onclick = function() {
          this.pause();
        }.bind(this);

        divWrapper.appendChild(divBlocker);
      }

      return divWrapper;
    },

    initYTPlayer: function() {
      var playerVars = {
        controls: 0,
        modestbranding: 1,
        rel: 0,
        showinfo: 0,
        loop: this.options_.loop ? 1 : 0
      };

      // Let the user set any YouTube parameter
      // https://developers.google.com/youtube/player_parameters?playerVersion=HTML5#Parameters
      // To use YouTube controls, you must use ytControls instead
      // To use the loop or autoplay, use the video.js settings

      if (typeof this.options_.autohide !== 'undefined') {
        playerVars.autohide = this.options_.autohide;
      }

      if (typeof this.options_['cc_load_policy'] !== 'undefined') {
        playerVars['cc_load_policy'] = this.options_['cc_load_policy'];
      }

      if (typeof this.options_.ytControls !== 'undefined') {
        playerVars.controls = this.options_.ytControls;
      }

      if (typeof this.options_.disablekb !== 'undefined') {
        playerVars.disablekb = this.options_.disablekb;
      }

      if (typeof this.options_.end !== 'undefined') {
        playerVars.end = this.options_.end;
      }

      if (typeof this.options_.color !== 'undefined') {
        playerVars.color = this.options_.color;
      }

      if (!playerVars.controls) {
        // Let video.js handle the fullscreen unless it is the YouTube native controls
        playerVars.fs = 0;
      } else if (typeof this.options_.fs !== 'undefined') {
        playerVars.fs = this.options_.fs;
      }

      if (typeof this.options_.end !== 'undefined') {
        playerVars.end = this.options_.end;
      }

      if (typeof this.options_.hl !== 'undefined') {
        playerVars.hl = this.options_.hl;
      } else if (typeof this.options_.language !== 'undefined') {
        // Set the YouTube player on the same language than video.js
        playerVars.hl = this.options_.language.substr(0, 2);
      }

      if (typeof this.options_['iv_load_policy'] !== 'undefined') {
        playerVars['iv_load_policy'] = this.options_['iv_load_policy'];
      }

      if (typeof this.options_.list !== 'undefined') {
        playerVars.list = this.options_.list;
      } else if (this.url && typeof this.url.listId !== 'undefined') {
        playerVars.list = this.url.listId;
      }

      if (typeof this.options_.listType !== 'undefined') {
        playerVars.listType = this.options_.listType;
      }

      if (typeof this.options_.modestbranding !== 'undefined') {
        playerVars.modestbranding = this.options_.modestbranding;
      }

      if (typeof this.options_.playlist !== 'undefined') {
        playerVars.playlist = this.options_.playlist;
      }

      if (typeof this.options_.playsinline !== 'undefined') {
        playerVars.playsinline = this.options_.playsinline;
      }

      if (typeof this.options_.rel !== 'undefined') {
        playerVars.rel = this.options_.rel;
      }

      if (typeof this.options_.showinfo !== 'undefined') {
        playerVars.showinfo = this.options_.showinfo;
      }

      if (typeof this.options_.start !== 'undefined') {
        playerVars.start = this.options_.start;
      }

      if (typeof this.options_.theme !== 'undefined') {
        playerVars.theme = this.options_.theme;
      }

      this.activeVideoId = this.url ? this.url.videoId : null;
      this.activeList = playerVars.list;

      this.ytPlayer = new YT.Player(this.options_.techId, {
        videoId: this.activeVideoId,
        playerVars: playerVars,
        events: {
          onReady: this.onPlayerReady.bind(this),
          onPlaybackQualityChange: this.onPlayerPlaybackQualityChange.bind(this),
          onStateChange: this.onPlayerStateChange.bind(this),
          onError: this.onPlayerError.bind(this)
        }
      });
    },

    onPlayerReady: function() {
      this.playerReady_ = true;
      this.triggerReady();

      if (this.playOnReady) {
        this.play();
      }
    },

    onPlayerPlaybackQualityChange: function() {

    },

    onPlayerStateChange: function(e) {
      var state = e.data;

      if (state === this.lastState || this.errorNumber) {
        return;
      }

      switch (state) {
        case -1:
          this.trigger('loadedmetadata');
          this.trigger('durationchange');
          break;

        case YT.PlayerState.ENDED:
          this.trigger('ended');
          break;

        case YT.PlayerState.PLAYING:
          this.trigger('timeupdate');
          this.trigger('durationchange');
          this.trigger('playing');
          this.trigger('play');

          if (this.isSeeking) {
            this.onSeeked();
          }
          break;

        case YT.PlayerState.PAUSED:
          this.trigger('canplay');
          if (this.isSeeking) {
            this.onSeeked();
          } else {
            this.trigger('pause');
          }
          break;

        case YT.PlayerState.BUFFERING:
          this.player_.trigger('timeupdate');
          this.player_.trigger('waiting');
          break;
      }

      this.lastState = state;
    },

    onPlayerError: function(e) {
      this.errorNumber = e.data;
      this.trigger('error');

      this.ytPlayer.stopVideo();
      this.ytPlayer.destroy();
      this.ytPlayer = null;
    },

    error: function() {
      switch (this.errorNumber) {
        case 5:
          return { code: 'Error while trying to play the video' };

        case 2:
        case 100:
        case 150:
          return { code: 'Unable to find the video' };

        case 101:
          return { code: 'Playback on other Websites has been disabled by the video owner.' };
      }

      return { code: 'YouTube unknown error (' + this.errorNumber + ')' };
    },

    src: function(src) {
      if (src) {
        this.setSrc({ src: src });

        if (this.options_.autoplay && !_isOnMobile) {
          this.play();
        }
      }

      return this.source;
    },

    poster: function() {
      // You can't start programmaticlly a video with a mobile
      // through the iframe so we hide the poster and the play button (with CSS)
      if (_isOnMobile) {
        return null;
      }

      return this.poster_;
    },

    setPoster: function(poster) {
      this.poster_ = poster;
    },

    setSrc: function(source) {
      if (!source || !source.src) {
        return;
      }

      delete this.errorNumber;
      this.source = source;
      this.url = Youtube.parseUrl(source.src);

      if (!this.options_.poster) {
        if (this.url.videoId) {
          // Set the low resolution first
          this.poster_ = 'https://img.youtube.com/vi/' + this.url.videoId + '/0.jpg';

          // Check if their is a high res
          this.checkHighResPoster();
        }
      }

      if (this.options_.autoplay && !_isOnMobile) {
        if (this.isReady_) {
          this.play();
        } else {
          this.playOnReady = true;
        }
      }
    },

    play: function() {
      if (!this.url || !this.url.videoId) {
        return;
      }

      this.wasPausedBeforeSeek = false;

      if (this.isReady_) {
        if (this.url.listId) {
          if (this.activeList === this.url.listId) {
            this.ytPlayer.playVideo();
          } else {
            this.ytPlayer.loadPlaylist(this.url.listId);
            this.activeList = this.url.listId;
          }
        }

        if (this.activeVideoId === this.url.videoId) {
          this.ytPlayer.playVideo();
        } else {
          this.ytPlayer.loadVideoById(this.url.videoId);
          this.activeVideoId = this.url.videoId;
        }
      } else {
        this.trigger('waiting');
        this.playOnReady = true;
      }
    },

    pause: function() {
      if (this.ytPlayer) {
        this.ytPlayer.pauseVideo();
      }
    },

    paused: function() {
      return (this.ytPlayer) ?
        (this.lastState !== YT.PlayerState.PLAYING && this.lastState !== YT.PlayerState.BUFFERING)
        : true;
    },

    currentTime: function() {
      return this.ytPlayer ? this.ytPlayer.getCurrentTime() : 0;
    },

    setCurrentTime: function(seconds) {
      if (this.lastState === YT.PlayerState.PAUSED) {
        this.timeBeforeSeek = this.currentTime();
      }

      if (!this.isSeeking) {
        this.wasPausedBeforeSeek = this.paused();
      }

      this.ytPlayer.seekTo(seconds, true);
      this.trigger('timeupdate');
      this.trigger('seeking');
      this.isSeeking = true;

      // A seek event during pause does not return an event to trigger a seeked event,
      // so run an interval timer to look for the currentTime to change
      if (this.lastState === YT.PlayerState.PAUSED && this.timeBeforeSeek !== seconds) {
        clearInterval(this.checkSeekedInPauseInterval);
        this.checkSeekedInPauseInterval = setInterval(function() {
          if (this.lastState !== YT.PlayerState.PAUSED || !this.isSeeking) {
            // If something changed while we were waiting for the currentTime to change,
            //  clear the interval timer
            clearInterval(this.checkSeekedInPauseInterval);
          } else if (this.currentTime() !== this.timeBeforeSeek) {
            this.trigger('timeupdate');
            this.onSeeked();
          }
        }.bind(this), 250);
      }
    },

    onSeeked: function() {
      clearInterval(this.checkSeekedInPauseInterval);
      this.isSeeking = false;

      if (this.wasPausedBeforeSeek) {
        this.pause();
      }

      this.trigger('seeked');
    },

    playbackRate: function() {
      return this.ytPlayer ? this.ytPlayer.getPlaybackRate() : 1;
    },

    setPlaybackRate: function(suggestedRate) {
      if (!this.ytPlayer) {
        return;
      }

      this.ytPlayer.setPlaybackRate(suggestedRate);
      this.trigger('ratechange');
    },

    duration: function() {
      return this.ytPlayer ? this.ytPlayer.getDuration() : 0;
    },

    currentSrc: function() {
      return this.source;
    },

    ended: function() {
      return this.ytPlayer ? (this.lastState === YT.PlayerState.ENDED) : false;
    },

    volume: function() {
      return this.ytPlayer ? this.ytPlayer.getVolume() / 100.0 : 1;
    },

    setVolume: function(percentAsDecimal) {
      if (!this.ytPlayer) {
        return;
      }

      this.ytPlayer.setVolume(percentAsDecimal * 100.0);
      this.setTimeout( function(){
        this.trigger('volumechange');
      }, 50);

    },

    muted: function() {
      return this.ytPlayer ? this.ytPlayer.isMuted() : false;
    },

    setMuted: function(mute) {
      if (!this.ytPlayer) {
        return;
      }
      else{
        this.muted(true);
      }

      if (mute) {
        this.ytPlayer.mute();
      } else {
        this.ytPlayer.unMute();
      }
      this.setTimeout( function(){
        this.trigger('volumechange');
      }, 50);
    },

    buffered: function() {
      if(!this.ytPlayer || !this.ytPlayer.getVideoLoadedFraction) {
        return {
          length: 0,
          start: function() {
            throw new Error('This TimeRanges object is empty');
          },
          end: function() {
            throw new Error('This TimeRanges object is empty');
          }
        };
      }

      var end = this.ytPlayer.getVideoLoadedFraction() * this.ytPlayer.getDuration();

      return {
        length: this.ytPlayer.getDuration(),
        start: function() { return 0; },
        end: function() { return end; }
      };
    },

    // TODO: Can we really do something with this on YouTUbe?
    load: function() {},
    reset: function() {},

    supportsFullScreen: function() {
      return true;
    },

    // Tries to get the highest resolution thumbnail available for the video
    checkHighResPoster: function(){
      var uri = 'https://img.youtube.com/vi/' + this.url.videoId + '/maxresdefault.jpg';

      try {
        var image = new Image();
        image.onload = function(){
          // Onload may still be called if YouTube returns the 120x90 error thumbnail
          if('naturalHeight' in image){
            if (image.naturalHeight <= 90 || image.naturalWidth <= 120) {
              return;
            }
          } else if(image.height <= 90 || image.width <= 120) {
            return;
          }

          this.poster_ = uri;
          this.trigger('posterchange');
        }.bind(this);
        image.onerror = function(){};
        image.src = uri;
      }
      catch(e){}
    }
  });

  Youtube.isSupported = function() {
    return true;
  };

  Youtube.canPlaySource = function(e) {
    return (e.type === 'video/youtube');
  };

  var _isOnMobile = /(iPad|iPhone|iPod|Android)/g.test(navigator.userAgent);

  Youtube.parseUrl = function(url) {
    var result = {
      videoId: null
    };

    var regex = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    var match = url.match(regex);

    if (match && match[2].length === 11) {
      result.videoId = match[2];
    }

    var regPlaylist = /[?&]list=([^#\&\?]+)/;
    match = url.match(regPlaylist);

    if(match && match[1]) {
      result.listId = match[1];
    }

    return result;
  };

  function loadApi() {
    var tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
  }

  function injectCss() {
    var css = // iframe blocker to catch mouse events
              '.vjs-youtube .vjs-iframe-blocker { display: none; }' +
              '.vjs-youtube.vjs-user-inactive .vjs-iframe-blocker { display: block; }' +
              '.vjs-youtube .vjs-poster { background-size: cover; }' +
              '.vjs-youtube-mobile .vjs-big-play-button { display: none; }';

    var head = document.head || document.getElementsByTagName('head')[0];

    var style = document.createElement('style');
    style.type = 'text/css';

    if (style.styleSheet){
      style.styleSheet.cssText = css;
    } else {
      style.appendChild(document.createTextNode(css));
    }

    head.appendChild(style);
  }

  Youtube.apiReadyQueue = [];

  window.onYouTubeIframeAPIReady = function() {
    Youtube.isApiReady = true;

    for (var i = 0; i < Youtube.apiReadyQueue.length; ++i) {
      Youtube.apiReadyQueue[i].initYTPlayer();
    }
  };

  loadApi();
  injectCss();

  // Older versions of VJS5 doesn't have the registerTech function
  if (typeof videojs.registerTech !== 'undefined') {
    videojs.registerTech('Youtube', Youtube);
  } else {
    videojs.registerComponent('Youtube', Youtube);
  }
}));


(function (root, factory) {
  if(typeof define === 'function' && define.amd) {
    define(['video.js'], function(videojs){
      return (root.Vimeo = factory(videojs));
    });
  } else if(typeof module === 'object' && module.exports) {
    module.exports = (root.Vimeo = factory(require('video.js')));
  } else {
    root.Vimeo = factory(root.videojs);
  }
}(this, function(videojs) {
  'use strict';

  var VimeoState = {
    UNSTARTED: -1,
    ENDED: 0,
    PLAYING: 1,
    PAUSED: 2,
    BUFFERING: 3
  };

  var Tech = videojs.getComponent('Tech');

  var Vimeo = videojs.extend(Tech, {
    constructor: function(options, ready) {
      Tech.call(this, options, ready);
      if(options.poster != "") {this.setPoster(options.poster);}
      this.setSrc(this.options_.source.src, true);

      // Set the vjs-vimeo class to the player
      // Parent is not set yet so we have to wait a tick
      setTimeout(function() {
        this.el_.parentNode.className += ' vjs-vimeo';
      }.bind(this));

    },

    dispose: function() {
      this.el_.parentNode.className = this.el_.parentNode.className.replace(' vjs-vimeo', '');
    },

    createEl: function() {
      this.vimeo = {};
      this.vimeoInfo = {};
      this.baseUrl = 'https://player.vimeo.com/video/';
      this.baseApiUrl = 'http://www.vimeo.com/api/v2/video/';
      this.videoId = Vimeo.parseUrl(this.options_.source.src).videoId;

      this.iframe = document.createElement('iframe');
      this.iframe.setAttribute('id', this.options_.techId);
      this.iframe.setAttribute('title', 'Vimeo Video Player');
      this.iframe.setAttribute('class', 'vimeoplayer');
      this.iframe.setAttribute('src', this.baseUrl + this.videoId + '?api=1&player_id=' + this.options_.techId);
      this.iframe.setAttribute('frameborder', '0');
      this.iframe.setAttribute('scrolling', 'no');
      this.iframe.setAttribute('marginWidth', '0');
      this.iframe.setAttribute('marginHeight', '0');
      this.iframe.setAttribute('webkitAllowFullScreen', '0');
      this.iframe.setAttribute('mozallowfullscreen', '0');
      this.iframe.setAttribute('allowFullScreen', '0');

      var divWrapper = document.createElement('div');
      //divWrapper.setAttribute('style', 'margin:0 auto;padding-bottom:56.25%;width:100%;height:0;position:relative;overflow:hidden;');
      divWrapper.setAttribute('class', 'vimeoFrame');
      divWrapper.appendChild(this.iframe);

      if (!_isOnMobile && !this.options_.ytControls) {
        var divBlocker = document.createElement('div');
        divBlocker.setAttribute('class', 'vjs-iframe-blocker');
        divBlocker.setAttribute('style', 'position:absolute;top:0;left:0;width:100%;height:100%');

        // In case the blocker is still there and we want to pause
        divBlocker.onclick = function() {
          this.onPause();
        }.bind(this);

        divWrapper.appendChild(divBlocker);
      }

      if (Vimeo.isApiReady) {
        this.initPlayer();
      } else {
        Vimeo.apiReadyQueue.push(this);
      }

      if(this.options_.poster == "") {
        $.getJSON(this.baseApiUrl + this.videoId + '.json?callback=?', {format: "json"}, (function(_this){
          return function(data) {
            // Set the low resolution first
            _this.setPoster(data[0].thumbnail_large);
          };
        })(this));
      }

      return divWrapper;
    },

    initPlayer: function() {
      var self = this;
      var vimeoVideoID = Vimeo.parseUrl(this.options_.source.src).videoId;
      //load vimeo
      if (this.vimeo && this.vimeo.api) {
        this.vimeo.api('unload');
        delete this.vimeo;
      }

      self.vimeo = $f(self.iframe);

      self.vimeoInfo = {
        state: VimeoState.UNSTARTED,
        volume: 1,
        muted: false,
        muteVolume: 1,
        time: 0,
        duration: 0,
        buffered: 0,
        url: self.baseUrl + self.videoId,
        error: null
      };

      this.vimeo.addEvent('ready', function(id){
        self.onReady();

        self.vimeo.addEvent('loadProgress', function(data, id){ self.onLoadProgress(data); });
        self.vimeo.addEvent('playProgress', function(data, id){ self.onPlayProgress(data); });
        self.vimeo.addEvent('play', function(id){ self.onPlay(); });
        self.vimeo.addEvent('pause', function(id){ self.onPause(); });
        self.vimeo.addEvent('finish', function(id){ self.onFinish(); });
        self.vimeo.addEvent('seek', function(data, id){ self.onSeek(data); });

      });

    },

    onReady: function(){
      this.isReady_ = true;
      this.triggerReady();
      this.trigger('loadedmetadata');
      if (this.startMuted) {
        this.setMuted(true);
        this.startMuted = false;
      }
    },

    onLoadProgress: function(data) {
      var durationUpdate = !this.vimeoInfo.duration;
      this.vimeoInfo.duration = data.duration;
      this.vimeoInfo.buffered = data.percent;
      this.trigger('progress');
      if (durationUpdate) this.trigger('durationchange');
    },
    onPlayProgress: function(data) {
      this.vimeoInfo.time = data.seconds;
      this.trigger('timeupdate');
    },
    onPlay: function() {
      this.vimeoInfo.state = VimeoState.PLAYING;
      this.trigger('play');
    },
    onPause: function() {
      this.vimeoInfo.state = VimeoState.PAUSED;
      this.trigger('pause');
    },
    onFinish: function() {
      this.vimeoInfo.state = VimeoState.ENDED;
      this.trigger('ended');
    },
    onSeek: function(data) {
      this.trigger('seeking');
      this.vimeoInfo.time = data.seconds;
      this.trigger('timeupdate');
      this.trigger('seeked');
    },
    onError: function(error){
      this.error = error;
      this.trigger('error');
    },

    error: function() {
      switch (this.errorNumber) {
        case 2:
          return { code: 'Unable to find the video' };

        case 5:
          return { code: 'Error while trying to play the video' };

        case 100:
          return { code: 'Unable to find the video' };

        case 101:
        case 150:
          return { code: 'Playback on other Websites has been disabled by the video owner.' };
      }

      return { code: 'Vimeo unknown error (' + this.errorNumber + ')' };
    },

    src: function() {
      return this.source;
    },

    poster: function() {
      return this.poster_;
    },

    setPoster: function(poster) {
      this.poster_ = poster;
    },

    setSrc: function(source) {
      if (!source || !source.src) {
        return;
      }

      this.source = source;
      this.url = Vimeo.parseUrl(source.src);

      if (!this.options_.poster) {
        if (this.url.videoId) {
          $.getJSON(this.baseApiUrl + this.videoId + '.json?callback=?', {format: "json"}, (function(_this){
            return function(data) {
              // Set the low resolution first
              _this.poster_ = data[0].thumbnail_small;
            };
          })(this));

          // Check if their is a high res
          this.checkHighResPoster();
        }
      }

      if (this.options_.autoplay && !_isOnMobile) {
        if (this.isReady_) {
          this.play();
        } else {
          this.playOnReady = true;
        }
      }
    },

    supportsFullScreen: function() {
      return true;
    },

    //TRIGGER
    load : function(){},
    play : function(){ this.vimeo.api('play'); },
    pause : function(){ this.vimeo.api('pause'); },
    paused : function(){
      return this.vimeoInfo.state !== VimeoState.PLAYING &&
             this.vimeoInfo.state !== VimeoState.BUFFERING;
    },

    currentTime : function(){ return this.vimeoInfo.time || 0; },

    setCurrentTime :function(seconds){
      this.vimeo.api('seekTo', seconds);
      this.player_.trigger('timeupdate');
    },

    duration :function(){ return this.vimeoInfo.duration || 0; },
    buffered :function(){ return videojs.createTimeRange(0, (this.vimeoInfo.buffered*this.vimeoInfo.duration) || 0); },

    volume :function() { return (this.vimeoInfo.muted)? this.vimeoInfo.muteVolume : this.vimeoInfo.volume; },
    setVolume :function(percentAsDecimal){
      this.vimeo.api('setvolume', percentAsDecimal);
      this.vimeoInfo.volume = percentAsDecimal;
      this.player_.trigger('volumechange');
    },
    currentSrc :function() {
      return this.el_.src;
    },
    muted :function() { return this.vimeoInfo.muted || false; },
    setMuted :function(muted) {
      if (muted) {
        this.vimeoInfo.muteVolume = this.vimeoInfo.volume;
        this.setVolume(0);
      } else {
        this.setVolume(this.vimeoInfo.muteVolume);
      }

      this.vimeoInfo.muted = muted;
      this.player_.trigger('volumechange');
    },

    // Tries to get the highest resolution thumbnail available for the video
    checkHighResPoster: function(){
      var uri = '';

      try {

        $.getJSON(this.baseApiUrl + this.videoId + '.json?callback=?', {format: "json"}, (function(_uri){
          return function(data) {
            // Set the low resolution first
            _uri = data[0].thumbnail_large;
          };
        })(uri));

        var image = new Image();
        image.onload = function(){
          // Onload thumbnail
          if('naturalHeight' in this){
            if(this.naturalHeight <= 90 || this.naturalWidth <= 120) {
              this.onerror();
              return;
            }
          } else if(this.height <= 90 || this.width <= 120) {
            this.onerror();
            return;
          }

          this.poster_ = uri;
          this.trigger('posterchange');
        }.bind(this);
        image.onerror = function(){};
        image.src = uri;
      }
      catch(e){}
    }
  });

  Vimeo.isSupported = function() {
    return true;
  };

  Vimeo.canPlaySource = function(e) {
    return (e.type === 'video/vimeo');
  };

  var _isOnMobile = /(iPad|iPhone|iPod|Android)/g.test(navigator.userAgent);

  Vimeo.parseUrl = function(url) {
    var result = {
      videoId: null
    };

    var regex = /^.*(vimeo\.com\/)((channels\/[A-z]+\/)|(groups\/[A-z]+\/videos\/))?([0-9]+)/;
    var match = url.match(regex);

    if (match) {
      result.videoId = match[5];
    }

    return result;
  };

  function injectCss() {
    var css = // iframe blocker to catch mouse events
              '.vjs-vimeo .vjs-iframe-blocker { display: none; }' +
              '.vjs-vimeo.vjs-user-inactive .vjs-iframe-blocker { display: block; }' +
              '.vjs-vimeo .vjs-poster { background-size: cover; }' +
              '.vjs-vimeo { height:100%; }' +
              '.vimeoplayer { width:100%; height:180%; position:absolute; left:0; top:-40%; }';

    var head = document.head || document.getElementsByTagName('head')[0];

    var style = document.createElement('style');
    style.type = 'text/css';

    if (style.styleSheet){
      style.styleSheet.cssText = css;
    } else {
      style.appendChild(document.createTextNode(css));
    }

    head.appendChild(style);
  }

  Vimeo.apiReadyQueue = [];

  var vimeoIframeAPIReady = function() {
    Vimeo.isApiReady = true;
    injectCss();

    for (var i = 0; i < Vimeo.apiReadyQueue.length; ++i) {
      Vimeo.apiReadyQueue[i].initPlayer();
    }
  };

  vimeoIframeAPIReady();

  videojs.registerTech('Vimeo', Vimeo);



  // Froogaloop API -------------------------------------------------------------

  // From https://github.com/vimeo/player-api/blob/master/javascript/froogaloop.js
  // Init style shamelessly stolen from jQuery http://jquery.com
  var Froogaloop = (function(){
      // Define a local copy of Froogaloop
      function Froogaloop(iframe) {
          // The Froogaloop object is actually just the init constructor
          return new Froogaloop.fn.init(iframe);
      }

      var eventCallbacks = {},
          hasWindowEvent = false,
          isReady = false,
          slice = Array.prototype.slice,
          playerOrigin = '*';

      Froogaloop.fn = Froogaloop.prototype = {
          element: null,

          init: function(iframe) {
              if (typeof iframe === "string") {
                  iframe = document.getElementById(iframe);
              }

              this.element = iframe;

              return this;
          },

          /*
           * Calls a function to act upon the player.
           *
           * @param {string} method The name of the Javascript API method to call. Eg: 'play'.
           * @param {Array|Function} valueOrCallback params Array of parameters to pass when calling an API method
           *                                or callback function when the method returns a value.
           */
          api: function(method, valueOrCallback) {
              if (!this.element || !method) {
                  return false;
              }

              var self = this,
                  element = self.element,
                  target_id = element.id !== '' ? element.id : null,
                  params = !isFunction(valueOrCallback) ? valueOrCallback : null,
                  callback = isFunction(valueOrCallback) ? valueOrCallback : null;

              // Store the callback for get functions
              if (callback) {
                  storeCallback(method, callback, target_id);
              }

              postMessage(method, params, element);
              return self;
          },

          /*
           * Registers an event listener and a callback function that gets called when the event fires.
           *
           * @param eventName (String): Name of the event to listen for.
           * @param callback (Function): Function that should be called when the event fires.
           */
          addEvent: function(eventName, callback) {
              if (!this.element) {
                  return false;
              }

              var self = this,
                  element = self.element,
                  target_id = element.id !== '' ? element.id : null;


              storeCallback(eventName, callback, target_id);

              // The ready event is not registered via postMessage. It fires regardless.
              if (eventName != 'ready') {
                  postMessage('addEventListener', eventName, element);
              }
              else if (eventName == 'ready' && isReady) {
                  callback.call(null, target_id);
              }

              return self;
          },

          /*
           * Unregisters an event listener that gets called when the event fires.
           *
           * @param eventName (String): Name of the event to stop listening for.
           */
          removeEvent: function(eventName) {
              if (!this.element) {
                  return false;
              }

              var self = this,
                  element = self.element,
                  target_id = element.id !== '' ? element.id : null,
                  removed = removeCallback(eventName, target_id);

              // The ready event is not registered
              if (eventName != 'ready' && removed) {
                  postMessage('removeEventListener', eventName, element);
              }
          }
      };

      /**
       * Handles posting a message to the parent window.
       *
       * @param method (String): name of the method to call inside the player. For api calls
       * this is the name of the api method (api_play or api_pause) while for events this method
       * is api_addEventListener.
       * @param params (Object or Array): List of parameters to submit to the method. Can be either
       * a single param or an array list of parameters.
       * @param target (HTMLElement): Target iframe to post the message to.
       */
      function postMessage(method, params, target) {
          if (!target.contentWindow.postMessage) {
              return false;
          }

          var data = JSON.stringify({
              method: method,
              value: params
          });

          target.contentWindow.postMessage(data, playerOrigin);
      }

      /**
       * Event that fires whenever the window receives a message from its parent
       * via window.postMessage.
       */
      function onMessageReceived(event) {
          var data, method;

          try {
              data = JSON.parse(event.data);
              method = data.event || data.method;
          }
          catch(e)  {
              //fail silently... like a ninja!
          }

          if (method == 'ready' && !isReady) {
              isReady = true;
          }

          // Handles messages from the vimeo player only
          if (!(/^https?:\/\/player.vimeo.com/).test(event.origin)) {
              return false;
          }

          if (playerOrigin === '*') {
              playerOrigin = event.origin;
          }

          var value = data.value,
              eventData = data.data,
              target_id = target_id === '' ? null : data.player_id,

              callback = getCallback(method, target_id),
              params = [];

          if (!callback) {
              return false;
          }

          if (value !== undefined) {
              params.push(value);
          }

          if (eventData) {
              params.push(eventData);
          }

          if (target_id) {
              params.push(target_id);
          }

          return params.length > 0 ? callback.apply(null, params) : callback.call();
      }


      /**
       * Stores submitted callbacks for each iframe being tracked and each
       * event for that iframe.
       *
       * @param eventName (String): Name of the event. Eg. api_onPlay
       * @param callback (Function): Function that should get executed when the
       * event is fired.
       * @param target_id (String) [Optional]: If handling more than one iframe then
       * it stores the different callbacks for different iframes based on the iframe's
       * id.
       */
      function storeCallback(eventName, callback, target_id) {
          if (target_id) {
              if (!eventCallbacks[target_id]) {
                  eventCallbacks[target_id] = {};
              }
              eventCallbacks[target_id][eventName] = callback;
          }
          else {
              eventCallbacks[eventName] = callback;
          }
      }

      /**
       * Retrieves stored callbacks.
       */
      function getCallback(eventName, target_id) {
          if (target_id && eventCallbacks[target_id]) {
              return eventCallbacks[target_id][eventName];
          }
          else if (eventCallbacks[eventName]) {
              return eventCallbacks[eventName];
          }
      }

      function removeCallback(eventName, target_id) {
          if (target_id && eventCallbacks[target_id]) {
              if (!eventCallbacks[target_id][eventName]) {
                  return false;
              }
              eventCallbacks[target_id][eventName] = null;
          }
          else {
              if (!eventCallbacks[eventName]) {
                  return false;
              }
              eventCallbacks[eventName] = null;
          }

          return true;
      }

      function isFunction(obj) {
          return !!(obj && obj.constructor && obj.call && obj.apply);
      }

      function isArray(obj) {
          return toString.call(obj) === '[object Array]';
      }

      // Give the init function the Froogaloop prototype for later instantiation
      Froogaloop.fn.init.prototype = Froogaloop.fn;

      // Listens for the message event.
      // W3C
      if (window.addEventListener) {
          window.addEventListener('message', onMessageReceived, false);
      }
      // IE
      else {
          window.attachEvent('onmessage', onMessageReceived);
      }

      // Expose froogaloop to the global object
      return (window.Froogaloop = window.$f = Froogaloop);

  })();
}));


