import { setCorrectImagePath } from '../../Utility/Utility';
export default angular.module('custom_carousel', []).directive('carousel', function ($timeout) {
    return {
        restrict: 'E',
        scope: {
            links: '='
        },
        controller: ['$http', function ($http) {
            var vm = this;
            vm.trustSrc = function (src) {
                return setCorrectImagePath(src);
            }
        }],
        controllerAs: 'vm',
        template: require('./carousel.html'),
        link: function (scope, element) {
            $timeout(function () {
                $('.carousel-indicators li', element).first().addClass('active');
                $('.carousel-inner .item', element).first().addClass('active');
            });
        }
    }
}).name;