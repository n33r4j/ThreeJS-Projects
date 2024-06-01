import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';


const scene = new THREE.Scene();
const main_camera = new THREE.PerspectiveCamera( 45, window.innerWidth/window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop( animate );
document.body.appendChild(renderer.domElement);

// const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
// scene.add(ambientLight);

const orbit = new OrbitControls(main_camera, renderer.domElement);

add_plane();
add_sphere();
const global_axes_helper = new THREE.AxesHelper(2);
scene.add(global_axes_helper);


main_camera.position.z = 8;

function add_plane(){
    const geometry = new THREE.PlaneGeometry(5, 5, 5);
    const material = new THREE.MeshBasicMaterial( { color: 0xeeeeee } );
    const plane = new THREE.Mesh( geometry, material );
    plane.rotation.x = -Math.PI/2.0;
    plane.position.y -= 0.5;
    scene.add(plane);
}

function add_sphere(){
    const geometry = new THREE.SphereGeometry( 1, 1, 1 );
    const material = new THREE.MeshBasicMaterial( { color: 0x0000ff } );
    const sphere = new THREE.Mesh( geometry, material );
    
    scene.add( sphere );
}

function animate(){
    // cube.rotation.y += 0.01;

    renderer.render(scene, main_camera);
}
