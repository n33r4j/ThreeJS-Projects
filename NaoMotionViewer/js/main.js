/*
To run, npm start

TODO:
- Add rigs for moving joints instead/in addition to sliders.
- Output .pos files into a window or a file.
- Create a timeline for animation keyframing/adjustment via splines.
- 
*/

import * as THREE from 'three'
import { Camera, Scene, MathUtils, Box3, DirectionalLight, AmbientLight } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

import { LoadingManager } from 'three';
import { LoaderUtils } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import URDFLoader from 'urdf-loader';

import GUI from 'lil-gui';


function createRobotCoordinateFrame(){
    // Robot Coordinate frame
    let rcf = {};
    var arrowPos = new THREE.Vector3( 0,0,0 );
    rcf['X'] = new THREE.ArrowHelper( new THREE.Vector3( 1,0,0 ), arrowPos, 0.4, 0x7F2020, 0.05, 0.02 );
    rcf['Y'] = new THREE.ArrowHelper( new THREE.Vector3( 0,0,-1 ), arrowPos, 0.4, 0x207F20, 0.05, 0.02 );
    rcf['Z'] = new THREE.ArrowHelper( new THREE.Vector3( 0,1,0 ), arrowPos, 0.4, 0x20207F, 0.05, 0.02 );
    return rcf;
};

function addRobotCoordinateFrame(scene, rcf){
    scene.add(rcf['X']);
    scene.add(rcf['Y']);
    scene.add(rcf['Z']);
}

function removeRobotCoordinateFrame(scene, rcf){
    scene.remove(rcf['X']);
    scene.remove(rcf['Y']);
    scene.remove(rcf['Z']);
}

const renderer = new THREE.WebGLRenderer({
    antialias: true
});
// renderer.shadowMap.enabled = true; // Might use this later
renderer.setSize(window.innerWidth, window.innerHeight);
const LIGHT = "0x8B9C9F";
const DARK = "0x#001136";
renderer.setClearColor(DARK);

document.body.appendChild(renderer.domElement);

const main_scene = new THREE.Scene();

// FOV, aspect ratio, near clipping plane, far clipping plane
const main_camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

const directionalLight = new DirectionalLight(0xffffff, 1.0);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.setScalar(1024);
directionalLight.position.set(5, 30, 5);
main_scene.add(directionalLight);

const ambientLight = new AmbientLight(0xffffff, 0.2);
main_scene.add(ambientLight);

const orbit = new OrbitControls(main_camera, renderer.domElement);

// AXIS
const global_axes_helper = new THREE.AxesHelper(3);
// main_scene.add(global_axes_helper);
const robot_axes_helper = createRobotCoordinateFrame();
addRobotCoordinateFrame(main_scene, robot_axes_helper);


main_camera.position.set(-10, 30, 30);
orbit.update();// Needs to be called everytime the camera position is updated ?

// Loading the Nao Model
const loading_manager = new LoadingManager();
const urdf_loader = new URDFLoader(loading_manager);

// Set custom loader for meshes
urdf_loader.loadMeshCb = function( path, manager, onComplete ){
    const objLoader = new OBJLoader( manager );
    objLoader.load(
        path,
        obj => {
            onComplete( obj ); // For some types, like GLTF, you need to return res.scene (See https://github.com/gkjohnson/urdf-loaders/blob/b67f5de98f6222e2d921ce24f46a6725dad9704e/javascript/example/src/index.js#L256)
        },
        undefined,
        err => {
            console.log("Could not load model. Reattempting...");
            onComplete( null, err );
        }
    );
};


// Due to security reasons, you can't directly load local files. You need to host them on an http server.
// Simplest way is to navigate to the folder containing the resource and run 
// 'python -m htt.server' and then open the url 'http://localhost:8000' in a browser.

let T12 = './T12/urdf/T12_flipped.URDF';
let NAO = 'nao.urdf'

let ROBOT_NAME = NAO;
let EXCLUDE_FINGERS = true;

let robot;

urdf_loader.parseVisual = true;
// urdf_loader.parseCollision = true;

// For now at least, the models should be in the root folder.
// which is currently 'src' as set in vite.config.js
urdf_loader.load(
    ROBOT_NAME,
    // robot => {
    //     main_scene.add( robot );
    // }
    result => {
        robot = result;
    }
);

loading_manager.onLoad = () => {
    if(ROBOT_NAME === T12){
        robot.rotation.x = Math.PI / 2;
        
        for (let i = 1; i <= 6; i++) {

            robot.joints[`HP${ i }`].setJointValue(MathUtils.degToRad(30));
            robot.joints[`KP${ i }`].setJointValue(MathUtils.degToRad(120));
            robot.joints[`AP${ i }`].setJointValue(MathUtils.degToRad(-60));

        }
        robot.updateMatrixWorld(true);

        const bb = new Box3();
        bb.setFromObject(robot);

        robot.position.y -= bb.min.y;
    }
    else if(ROBOT_NAME === NAO)
    {
        robot.rotation.x = -Math.PI / 2;
        orbit.target.set(0, 0, 0);
        main_camera.position.set(1, 0.2, 0);
        main_camera.lookAt(0, 0, 0);
        // main_camera.zoom = 35;
        main_camera.updateProjectionMatrix();
        // orbit.keyPanSpeed = 0.1;
        //orbit.update();
    }
    main_scene.add(robot);
    // console.log(robot.joints);

    const gui = new GUI(); // https://lil-gui.georgealways.com/#Guide#Numbers-and-Sliders
    let gui_fields = {};
    
    gui_fields['Reset View'] = function() {
        main_camera.position.set(1, 0.2, 0);
        main_camera.lookAt(0, 0, 0);
        //main_camera.updateProjectionMatrix();
    };
    gui.add(gui_fields, 'Reset View');

    gui_fields['Reset Joints'] = function() {
        for (const [k, v] of Object.entries(robot.joints))
        {
            robot.setJointValue(k, 0.0);
            gui_fields[k] = 0.0;
        }    
    };
    gui.add(gui_fields, 'Reset Joints');
    
    gui_fields['Global Axis'] = false;
    gui.add(gui_fields, 'Global Axis').onChange( value => {
        if(value){
            main_scene.add(global_axes_helper);
        }
        else{
            main_scene.remove(global_axes_helper);
        }
    });

    // This is temporary. Ideally, this should move with the torso.
    gui_fields['Robot Axis'] = true;
    gui.add(gui_fields, 'Robot Axis').onChange( value => {
        if(value){
            addRobotCoordinateFrame(main_scene, robot_axes_helper);
        }
        else{
            removeRobotCoordinateFrame(main_scene, robot_axes_helper);
        }
    });

    for (const [k, v] of Object.entries(robot.joints)){
        if(!k.endsWith('joint') && (EXCLUDE_FINGERS && !k.includes("Finger") && !k.includes("Thumb"))){
            //console.log(k);
            gui_fields[k] = 0.0;

            gui.add(gui_fields, k, (v.limit.lower*180.0)/Math.PI, (v.limit.upper*180.0)/Math.PI)
                .listen()
                .onChange(value => {
                    robot.setJointValue(k, (value * Math.PI)/180.0);
                    //console.log(value);
            });
        }
    }
    
};


function animate(time){
    renderer.render(main_scene, main_camera);
}

renderer.setAnimationLoop(animate);

window.addEventListener('resize', function(){
    main_camera.aspect = window.innerWidth / this.window.innerHeight;
    main_camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
