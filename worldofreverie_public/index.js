'use strict';

var mouse = {
    x: 0,
    y: 0
};
var map, canvas, ctx;
var marker = null;
var container, mesh, renderer, camera, scene, material, textBox;
var addButton, addressInput, brower;
var myShapeGeometry, myShapeMesh, myShapeMaterial;
var fov = 100,
    nFov = 70;
var oDist = 0,
    oFov;
var lat = 0,
    lon = 0,
    nLat = 0,
    nLon = 0;
var pos;
var zoom;
var geocoder;
var error, errorDiv;
var message, messageDiv;
var activeLocation = null;
var preloader = document.getElementById('preloader');
var bar = document.getElementById('bar');
var cd = new Date();
var time = cd.getTime();
var position = {
    x: 0,
    y: 0
};
var loader = new GSVPANO.PanoLoader();
var textMesh;
var handProxy;
var objects = [];
// var icosahedron;

// Initialize Firebase
var config = {
    apiKey: "AIzaSyANNXCX3qWs_hIaP8OU-JIpXYPBHYUQYzE",
    authDomain: "fir-c363f.firebaseapp.com",
    databaseURL: "https://fir-c363f.firebaseio.com",
    storageBucket: "fir-c363f.appspot.com",
    messagingSenderId: "647155671887"
};
firebase.initializeApp(config);
var database = firebase.database();



function setProgress(progress) {
    bar.style.width = (preloader.clientWidth - 6) * progress / 100 + 'px';
}

function showProgress(show) {
    preloader.style.opacity = (show == true) ? 1 : 0;
    preloader.style.display = (show == true) ? 'block' : 'none';
}

function setZoom(z) {
    zoom = z;
    loader.setZoom(z);
    if (activeLocation) loader.load(activeLocation);
}

function geoSuccess(position) {
    var currentLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
    // map.panTo( currentLocation );
    // addMarker( currentLocation ); // move to position (thanks @theCole!)
}

function geoError(message) {
    showError(message);
}

function initialize() {

    var locations = [{
            lat: 40.757169,
            lng: -73.9858096
        }

        // {
        //     lat: 26.1861204,
        //     lng: 127.3478658
        // }

    ];

    if (window.location.hash) {
        var parts = window.location.hash.substr(1).split(',');
        pos = {
            lat: parts[0],
            lng: parts[1]
        };
    } else {
        pos = locations[Math.floor(Math.random() * locations.length)];
    }
    var myLatlng = new google.maps.LatLng(pos.lat, pos.lng);

    // background street view
    canvas = document.createElement('canvas');
    ctx = canvas.getContext('2d');
    container = document.getElementById('pano');
    camera = new THREE.PerspectiveCamera(fov, window.innerWidth / window.innerHeight, 1, 1100);
    camera.target = new THREE.Vector3(0, 0, 0);

    scene = new THREE.Scene();
    scene.add(camera);

    try {
        var isWebGL = !!window.WebGLRenderingContext && !!document.createElement('canvas').getContext('experimental-webgl');
    } catch (e) {}

    renderer = new THREE.WebGLRenderer();
    renderer.autoClearColor = false;
    renderer.setSize(window.innerWidth, window.innerHeight);

    material = new THREE.ShaderMaterial({
        uniforms: {
            map: {
                type: "t",
                // value: THREE.ImageUtils.loadTexture('placeholder.jpg')
            },
        },
        vertexShader: document.getElementById('vs-sphere').textContent,
        fragmentShader: document.getElementById('fs-sphere').textContent,
        side: THREE.DoubleSide
    });

    var faces = 50;
    mesh = new THREE.Mesh(new THREE.SphereGeometry(500, 60, 40), material);
    scene.add(mesh);
    container.appendChild(renderer.domElement);

    var myOptions = {
        zoom: 14,
        center: myLatlng,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        streetViewControl: false
    }
    map = new google.maps.Map(document.getElementById("map"), myOptions);
    google.maps.event.addListener(map, 'click', function(event) {
        addMarker(event.latLng);
    });

    geocoder = new google.maps.Geocoder();


    //ugly little greeen cube that follows camera like your handPosition
    var handGeometry = new THREE.SphereGeometry( 5, 32, 32 );
    var handMaterial = new THREE.MeshBasicMaterial( {color: 0xffff00} );
    handProxy = new THREE.Mesh(handGeometry, handMaterial);
    scene.add(camera); //add the camera to the scene
    camera.add(handProxy); // then add the handProxy to the camera so it follow it
    handProxy.position.set(0, 0, -10);
    handProxy.scale.set(0.02, 0.02, 0.02);

    // handProxy.visible = false; //less ugly

    // foreground object
    // var icogeometry = new THREE.IcosahedronGeometry(50, 0);
    // var icomaterial = new THREE.MeshNormalMaterial();
    // icosahedron = new THREE.Mesh(icogeometry, icomaterial);
    // icosahedron.position.set(200, 50, -50);
    // scene.add(icosahedron);
    // icosahedron.rotation.y = -0.25;
    // camera.position.z = 50;


    textBox = document.getElementById('textBox');
    addButton = document.getElementById('addButton');
    addressInput = $("#address");;


    container.addEventListener('mousedown', onContainerMouseDown, false);
    container.addEventListener('mousemove', onContainerMouseMove, false);
    container.addEventListener('mouseup', onContainerMouseUp, false);
    container.addEventListener('touchstart', onTouchStart, false);
    container.addEventListener('touchmove', onTouchMove, false);
    container.addEventListener('touchend', onTouchEnd, false);
    container.addEventListener('touchcancel', onTouchEnd, false);
    container.addEventListener('mousewheel', onContainerMouseWheel, false);
    container.addEventListener('DOMMouseScroll', onContainerMouseWheel, false);
    addButton.addEventListener('click', addButtonClicked, false);

    window.addEventListener('resize', onWindowResized, false);




    onWindowResized(null);

    // var el = document.getElementById('myLocationButton');
    // el.addEventListener('click', function(event) {
    //     event.preventDefault();
    //     navigator.geolocation.getCurrentPosition(geoSuccess, geoError);
    // }, false);

    navigator.pointer = navigator.pointer || navigator.webkitPointer || navigator.mozPointer;

    var el = document.getElementById('searchButton');
    el.addEventListener('click', function(event) {
        event.preventDefault();
        clearObjects();
        findAddress(document.getElementById("address").value);
        getScene(addressInput.val());
    }, false);

    errorDiv = document.getElementById('error');
    messageDiv = document.getElementById('message');

    // showMessage('Ready. <b>Click a street in the map.</b>');

    loader.onProgress = function(p) {
        setProgress(p);
    };

    loader.onPanoramaData = function(result) {
        showProgress(true);
        // showMessage('Panorama OK. Loading and composing tiles...');
    }

    loader.onNoPanoramaData = function(status) {
        showError("Could not retrieve panorama for the following reason: " + status);
    }

    loader.onPanoramaLoad = function() {
        activeLocation = this.location;
        mesh.material.uniforms.map.value = new THREE.Texture(this.canvas[0]);
        mesh.material.uniforms.map.value.needsUpdate = true;
        // showMessage('Panorama is loaded.<br/>The images are ' + this.copyright);
        showProgress(false);
    };

    setZoom(3);
    addMarker(myLatlng); // initial position (thanks @mrdoob!)
    animate();
    loadList()
}

window.addEventListener('load', initialize, false);


function findAddress(address) {
    showMessage('Getting coordinates...');
    geocoder.geocode({
        'address': address
    }, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
            map.setCenter(results[0].geometry.location);
            showMessage('Address found.');
            addMarker(results[0].geometry.location); // move to position (thanks @jocabola!)
        } else {
            showError("Geocode was not successful for the following reason: " + status);
            showProgress(false);
        }
    });
}

function showError(message) {
    errorDiv.innerHTML = message;
}

function showMessage(message) {
    showError('');
    messageDiv.innerHTML = message;
}

function onWindowResized(event) {
    renderer.setSize(container.clientWidth, container.clientHeight);
    camera.projectionMatrix.makePerspective(fov, window.innerWidth / window.innerHeight, camera.near, camera.far);
}

var isUserInteracting = false;
var onPointerDownPointerX, onPointerDownPointerY, onPointerDownLon, onPointerDownLat;

function onContainerMouseDown(event) {

    event.preventDefault();

    isUserInteracting = true;
    var el = document.querySelectorAll('.hide');
    for (var j = 0; j < el.length; j++) {
        el[j].style.opacity = 0;
        el[j].style.pointerEvents = 'none';
    }

    onPointerDownPointerX = event.clientX;
    onPointerDownPointerY = event.clientY;

    onPointerDownLon = lon;
    onPointerDownLat = lat;

    // icosahedron.position.set(-event.clientX/10, -event.clientY/10, -50);
}



function onContainerMouseMove(event) {

    event.preventDefault();

    var lookSpeed = .15;
    var f = fov / 500;
    if (navigator.pointer && navigator.pointer.isLocked) {
        nLon = event.webkitMovementX * f;
        nLat += event.webkitMovementY * f;
    } else if (document.mozPointerLockElement == container) {
        if (Math.abs(event.mozMovementX) < 100 || Math.abs(event.mozMovementY) < 100) {
            nLon = event.mozMovementX * f;
            nLat -= event.mozMovementY * f;
        }
    } else {
        if (isUserInteracting) {
            var dx = (onPointerDownPointerX - event.clientX) * f;
            var dy = (event.clientY - onPointerDownPointerY) * f;
            nLon = dx + onPointerDownLon; // reversed dragging direction (thanks @mrdoob!)
            nLat = dy + onPointerDownLat;
        }
    }

    event.preventDefault();

    // move foreground object
    // mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    // mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    //
    // var vector = new THREE.Vector3(mouse.x, mouse.y, 0.5);
    // vector.unproject(camera);
    // var dir = vector.sub(camera.position).normalize();
    // var distance = camera.position.z + 150;
    // var pos = camera.position.clone().add(dir.multiplyScalar(distance));
    // textMesh.position.copy(pos);
}

function onContainerMouseWheel(event) {
    event = event ? event : window.event;
    nFov = fov - (event.detail ? event.detail * -5 : event.wheelDelta / 10);

}

function onTouchStart(event) {
    isUserInteracting = true;
    var el = document.querySelectorAll('.hide');
    for (var j = 0; j < el.length; j++) {
        el[j].style.opacity = 0;
        el[j].style.pointerEvents = 'none';
    }
    if (event.touches.length == 2) {
        var t = event.touches;
        oDist = Math.sqrt(
            Math.pow(t[0].clientX - t[1].clientX, 2) +
            Math.pow(t[0].clientY - t[1].clientY, 2));
        oFov = nfov;
        isUserPinching = true;
    } else {
        var t = event.touches[0];
        onPointerDownPointerX = t.clientX;
        onPointerDownPointerY = t.clientY;
        onPointerDownLon = lon;
        onPointerDownLat = lat;
    }
    event.preventDefault();
}

function onTouchMove(event) {
    if (event.touches.length == 2) {
        var t = event.touches;
        var dist = Math.sqrt(
            Math.pow(t[0].clientX - t[1].clientX, 2) +
            Math.pow(t[0].clientY - t[1].clientY, 2));
        nFov = oFov + .1 * (oDist - dist);
    } else {
        var t = event.touches[0];
        nLon = -.1 * (t.clientX - onPointerDownPointerX) + onPointerDownLon;
        nLat = .1 * (t.clientY - onPointerDownPointerY) + onPointerDownLat;
    }
    event.preventDefault();
}

function onTouchEnd(event) {
    event.preventDefault();
    isUserInteracting = false;
    var el = document.querySelectorAll('.hide');
    for (var j = 0; j < el.length; j++) {
        el[j].style.opacity = 1;
        el[j].style.pointerEvents = 'auto';
    }
}

function onContainerMouseUp(event) {
    event.preventDefault();
    isUserInteracting = false;
    var el = document.querySelectorAll('.hide');
    for (var j = 0; j < el.length; j++) {
        el[j].style.opacity = 1;
        el[j].style.pointerEvents = 'auto';
    }
}
//
function addButtonClicked(event) {
    //text add
    event.preventDefault();

    var posInWorld = handProxy.getWorldPosition();
    var rotationInWord = handProxy.getWorldRotation();
    var finalTextMesh = createText(textBox.value, posInWorld.x, posInWorld.y, posInWorld.z, rotationInWord.x, rotationInWord.y, rotationInWord.z, camera.fov);
    console.log(finalTextMesh);
    scene.add(finalTextMesh);
    objects.push(finalTextMesh);
    saveText(textMesh);

    event.preventDefault();
}


function addMarker(location) {
    if (marker) marker.setMap(null);
    marker = new google.maps.Marker({
        position: location,
        map: map
    });
    marker.setMap(map);
    // showMessage('Loading panorama for zoom ' + zoom + '...');
    loader.load(location);
}

var panoramas = [];
var circle = null;
var copyright;


function animate() {
    requestAnimationFrame(animate);
    render();

    // foreground move
    // icosahedron.rotation.x += 0.05;
}


var ellapsedTime, ellapsedFactor, phi, theta;

function render() {

    var cd = new Date();
    var ctime = cd.getTime();

    ellapsedTime = (ctime - time);
    ellapsedFactor = ellapsedTime / 16;

    var s = .15 * ellapsedFactor;
    lon += (nLon - lon) * s;
    lat += (nLat - lat) * s;
    fov += (nFov - fov) * s;

    camera.fov = fov;
    camera.updateProjectionMatrix();

    lat = Math.max(-85, Math.min(85, lat));
    phi = (90 - lat) * Math.PI / 180;
    theta = lon * Math.PI / 180;

    camera.target.x = 500 * Math.sin(phi) * Math.cos(theta);
    camera.target.y = 500 * Math.cos(phi);
    camera.target.z = 500 * Math.sin(phi) * Math.sin(theta);
    camera.lookAt(camera.target);
    renderer.render(scene, camera);

    time = ctime;
}


function createText(texts, x, y, z, rx, ry, rz, size) {
    var textCanvas = document.createElement("canvas");
    textCanvas.width = 4096;
    textCanvas.height = 4096;
    var context = textCanvas.getContext("2d");
    context.clearRect(0, 0, textCanvas.width, textCanvas.height);
    var fontSize = size / 0.5;
    context.font = fontSize + "pt Arial Black";
    // context.textAlign = "center";
    context.fillStyle = "white";
    context.shadowColor = "black";
    context.shadowOffsetX = 3;
    context.shadowOffsetY = 3;
    context.shadowBlur = 7;
    var text = texts;
    context.fillText(text, textCanvas.width / 2, textCanvas.height / 2);
    var textTexture = new THREE.Texture(textCanvas);
    textTexture.needsUpdate = true;
    var textMaterial = new THREE.MeshBasicMaterial({
        map: textTexture,
        transparent: true
    });
    textMesh = new THREE.Mesh(new THREE.PlaneGeometry(25, 25), textMaterial);
    textMesh.position.x = x;
    textMesh.position.y = y;
    textMesh.position.z = z;
    textMesh.rotation.x = rx;
    textMesh.rotation.y = ry;
    textMesh.rotation.z = rz;
    textMesh.scale.set(1, 1, 1);
    return textMesh;
}


function saveText(thisObj) {
    //make an object for sending
    var data = {
        type: "text",
        msg: textBox.value,
        x: thisObj.position.x,
        y: thisObj.position.y,
        z: thisObj.position.z,
        rx: thisObj.rotation.x,
        ry: thisObj.rotation.y,
        rz: thisObj.rotation.z,
        size: camera.fov,
        lat: pos.lat,
        lon: pos.lng
    };

    var query = addressInput.val();
    var ref = database.ref('osc_final/' + query);
    ref.push(data);
}


function getScene(location) {

    var query = location;
    var ref = database.ref('osc_final/' + query);
    ref.once('value', gotData, errData);

    function gotData(data) {
        var parsedData = data.val();
        console.log(parsedData);
        var keys = Object.keys(parsedData);
        for (var i = 0; i < keys.length; i++) {
            var msg = parsedData[keys[i]].msg;
            var x = parsedData[keys[i]].x;
            var y = parsedData[keys[i]].y;
            var z = parsedData[keys[i]].z;
            var rx = parsedData[keys[i]].rx;
            var ry = parsedData[keys[i]].ry;
            var rz = parsedData[keys[i]].rz;
            var size = parsedData[keys[i]].size;
            var newText = createText(msg, x, y, z, rx, ry, rz, size);
            scene.add(newText);
            objects.push(newText);
        }
    }
}

function loadList() {

    var ref = database.ref('osc_final/');
    ref.once('value', gotData, errData);

    function gotData(data) {
        var parsedData = data.val();
        var keys = Object.keys(parsedData);
        for (var i = 0; i < keys.length; i++) {
            var list = keys[i];
            var newButton = document.createElement('button');
            newButton.innerHTML = list;
            newButton.addEventListener('click', function() {
                event.preventDefault();
                clearObjects();
                findAddress(this.innerHTML);
                getScene(this.innerHTML);
                addressInput.val(this.innerHTML);
            });
            $('#browser').append(newButton);
        }
    }
}

function clearObjects() {
    for (var i = objects.length - 1; i > -1; i--) {
        var obj = objects[i];
        scene.remove(obj);
    }
    objects = [];
}

function errData(data) {
    console.log('Error');
}
