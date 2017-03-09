
angular.module('starter', ['ionic','ngCordova'])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
  });
})
  .controller('ImageCtrl', function ($scope, $cordovaCamera, $cordovaFile, $cordovaFileTransfer,
                                     $cordovaDevice, $ionicPopup, $cordovaActionSheet) {
    $scope.image = null;

    $scope.showAlert = function(title, msg) {
      var alertPopup = $ionicPopup.alert({
        title: title,
        template: msg
      });
    };
    $scope.loadImage = function() {
      var options = {
        title: 'Select Image Source',
        buttonLabels: ['Load from Library', 'Use Camera'],
        addCancelButtonWithLabel: 'Cancel',
        androidEnableCancelButton : true,
      };
      $cordovaActionSheet.show(options).then(function(btnIndex) {
        var type = null;
        if (btnIndex === 1) {
          type = Camera.PictureSourceType.PHOTOLIBRARY;
        } else if (btnIndex === 2) {
          type = Camera.PictureSourceType.CAMERA;
        }
        if (type !== null) {
          $scope.selectPicture(type);
        }
      });
    };






    $scope.selectPicture = function(sourceType) {
      var options = {
        quality: 100,
        destinationType: Camera.DestinationType.FILE_URI,
        sourceType: sourceType,
        saveToPhotoAlbum: false
      };

      $cordovaCamera.getPicture(options).then(function(imagePath) {
          // Grab the file name of the photo in the temporary directory
          var currentName = imagePath.replace(/^.*[\\\/]/, '');

          //Create a new name for the photo
          var d = new Date(),
            n = d.getTime(),
            newFileName =  n + ".jpg";

          // If you are trying to load image from the gallery on Android we need special treatment!
          if ($cordovaDevice.getPlatform() == 'Android' && sourceType === Camera.PictureSourceType.PHOTOLIBRARY) {
            window.FilePath.resolveNativePath(imagePath, function(entry) {
                window.resolveLocalFileSystemURL(entry, success, fail);
                function fail(e) {
                  console.error('Error: ', e);
                }

                function success(fileEntry) {
                  var namePath = fileEntry.nativeURL.substr(0, fileEntry.nativeURL.lastIndexOf('/') + 1);
                  // Only copy because of access rights
                  $cordovaFile.copyFile(namePath, fileEntry.name, cordova.file.dataDirectory, newFileName).then(function(success){
                    $scope.image = newFileName;
                  }, function(error){
                    $scope.showAlert('Error', error.exception);
                  });
                };
              }
            );
          } else {
            console.log("hwewew")
            var namePath = imagePath.substr(0, imagePath.lastIndexOf('/') + 1);
            // Move the file to permanent storage
            $cordovaFile.moveFile(namePath, currentName, cordova.file.dataDirectory, newFileName).then(function(success){
              $scope.image = newFileName;

              console.log("newFileName : "+newFileName);
            }, function(error){
              $scope.showAlert('Error', error.exception);
            });
          }
        },
        function(err){
          // Not always an error, maybe cancel was pressed...
        })
    };
    $scope.pathForImage = function(image) {
      if (image === null) {
        return '';
      } else {

        console.log("cordova.file.dataDirectory + image @@ : "+cordova.file.dataDirectory + image);
        $scope.imgSrc = cordova.file.dataDirectory + image;
        return cordova.file.dataDirectory + image;
      }
    };

    $scope.uploadImage = function() {
      // Destination URL
      // File for Upload
      var targetPath = $scope.pathForImage($scope.image);
      console.log("targetPath : "+targetPath);

      // File name only
      var filename = $scope.image;
      console.log("$scope.image : "+$scope.image);
     // uploadToServer(filename,targetPath);

      var uploadOptions = {
        params : { 'upload_preset': 'cloudinary Preset name '}
      };
      $cordovaFileTransfer
        // Your Cloudinary URL will go here
        .upload('https://api.cloudinary.com/v1_1/YOURS_PATH_TO_CLOUDINARY/image/upload', targetPath, uploadOptions)

        .then(function(result) {
          var response = JSON.parse(decodeURIComponent(result.response));
          console.log("response"+JSON.stringify(response));
        }, function(err) {

          console.log("err"+JSON.stringify(err));
        }, function (progress) {
          var uploadProgress = progress.loaded / progress.total;


          $ionicLoading.show({template : 'Uploading Picture : ' + uploadProgress + '%'});
          console.log("percentage"+JSON.stringify(progress));
        });

    }
    // The rest of the app comes in here
  })
