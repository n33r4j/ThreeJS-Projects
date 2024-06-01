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
add_cube();
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

function add_cube(){
    const geometry = new THREE.BoxGeometry( 1, 1, 1 );
    const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
    const cube = new THREE.Mesh( geometry, material );
    // For edges
    const edges = new THREE.EdgesGeometry( geometry ); 
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial( { color: 0xffffff , linewidth: 1 } ) ); 
    cube.add( line );
    
    scene.add( cube );
}

function animate(){
    // cube.rotation.y += 0.01;

    renderer.render(scene, main_camera);
}
