import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import GUI from 'lil-gui';
import Stats from 'stats';

const stats = new Stats();
stats.showPanel(0);
document.body.appendChild(stats.dom);



// gui.add(sliders, 'PosX', -10, 10, 0.1).listen().onChange(value => { main_camera.position.x = value; orbit.update(); });
// gui.add(sliders, 'PosY', -10, 10, 0.1).listen().onChange(value => { main_camera.position.y = value; orbit.update(); });
// gui.add(sliders, 'PosZ', -10, 10, 0.1).listen().onChange(value => { main_camera.position.z = value; orbit.update(); });

// gui.add(sliders, 'RotX', -Math.PI/2, Math.PI/2).listen().onChange(value => { main_camera.rotation.x = value; });
// gui.add(sliders, 'RotY', -Math.PI/2, Math.PI/2).listen().onChange(value => { main_camera.rotation.y = value; });
// gui.add(sliders, 'RotZ', -Math.PI/2, Math.PI/2).listen().onChange(value => { main_camera.rotation.z = value; });
var SCALE = 200.0;

function load_course_data(){
    const course_data = [];
    // routes/TBR-21km-course-v3.gpx
    fetch("routes/sydney-east-coast-1.gpx")
        .then(response => response.text())
        .then((data) => {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(data,"text/xml");
            const course = xmlDoc.getElementsByTagName("trk")[0];
            //console.log(course);
            // Not always present
            //const course_name = course.getElementsByTagName("name")[0].textContent;
            // console.log(course_name);
            const coords = course.getElementsByTagName("trkpt");
            // console.log(coords);
            var xlim = [-10000.0, 10000.0]; // max, min
            var zlim = [-10000.0, 10000.0];

            for(var i = 0; i < coords.length; ++i){
                // 1.0 might not work
                // upto 50.0 is okay, 100.0 ~ 500.0 is good enough
                // for larger maps, try higher numbers if slow
                var scale = SCALE; // larger means smaller map
                var yExaggerate = 10.0; // keep between 10 ~ 100 to see elevation for flatter courses
                var fA = 1000000.0;
                var fB = 1000000.0;
                // [TODO]: So it seems that some points have more precision than 6 digits sometime.
                // Might need to handle this, lest they look flat.

                // translate
                var tX = 0;
                var tY = 0.5; // move sea level
                var tZ = -5;

                var X = (parseFloat(coords[i].getAttribute('lat')) * fA) % fB / scale;
                var Y = tY + parseFloat(coords[i].textContent) / (scale/yExaggerate);
                var Z = (parseFloat(coords[i].getAttribute('lon') * fA) % fB / scale);
                
                // For center calculation
                if(X > xlim[0]){
                    xlim[0] = X;
                }

                if(X < xlim[1]){
                    xlim[1] = X;
                }

                if(Z > zlim[0]){
                    zlim[0] = Z;
                }

                if(Z < zlim[1]){
                    zlim[1] = Z;
                }
                course_data.push(new THREE.Vector3(X,Y,Z));
                // console.log(typeof(X), typeof(Y), Z);
            }
            var course_center = [xlim[1] + (xlim[0]-xlim[1]) * 0.5, zlim[1] + (zlim[0]-zlim[1]) * 0.5];
            console.log(course_center);
            course_data.forEach((pt) => {
                pt.x -= course_center[0];
                pt.z -= course_center[1];
            })
            var s = Math.ceil(Math.max(xlim[0]-xlim[1], zlim[0]-zlim[1]));
            var margin = 2;
            add_plane(s + margin);
        })
        .then(() => {
            // console.log(course_data);
            add_points(course_data);
            add_line(course_data);
            add_path(course_data);
        })
        
}

// const gui = new GUI();

// const sliders = {
//     Top: function() { main_camera.position.set(0,5,0); main_camera.rotateOnAxis(new THREE.Vector3(1, 0, 0), Math.PI/2); orbit.update(); }
// };

// gui.add(sliders, "Top");

const scene = new THREE.Scene();
const main_camera = new THREE.PerspectiveCamera( 45, window.innerWidth/window.innerHeight, 0.01, 1000);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop( animate );
document.body.appendChild(renderer.domElement);

// const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
// scene.add(ambientLight);

const orbit = new OrbitControls(main_camera, renderer.domElement);
orbit.zoomSpeed = -1; // To have infinite zoom (i.e. no slow-down when zooming)

main_camera.position.set(-50,300,0); 
// main_camera.rotateOnAxis(new THREE.Vector3(1, 0, 0), Math.PI/4);
// main_camera.updateProjectionMatrix();
orbit.update();

load_course_data();

const global_axes_helper = new THREE.AxesHelper(2);
scene.add(global_axes_helper);

function get_parallel(pts, w) {
    const pts_p = [];
    const p_width = w;
    for(var i=0; i<pts.length-1; ++i){
        const dir = new THREE.Vector3();
        dir.subVectors(pts[i+1], pts[i]).normalize();
        dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI/2.0);
        dir.multiplyScalar(p_width);
        //console.log(dir);

        if(i === 0){
            const p0 = new THREE.Vector3();
            p0.addVectors(pts[i], dir);
            //p0.y = pts[i].y;
            //p0.clampLength(0.0, 0.3);
            pts_p.push(p0);// 0'
        }
        const p1 = new THREE.Vector3();
        p1.addVectors(pts[i+1], dir);
        //p1.y = pts[i+1].y;
        //p1.clampLength(0.0, 0.3);
        pts_p.push(p1);// 1'
    }
    //console.log(pts_p);
    return pts_p;
}

function make_ribbon_mesh(pts_A, pts_B){
    const pts = [];
    for(var i=0; i<pts_A.length-1; ++i){
        pts.push(pts_A[i]);
        pts.push(pts_A[i+1]);
        pts.push(pts_B[i]);

        pts.push(pts_B[i]);
        pts.push(pts_B[i+1]);
        pts.push(pts_A[i+1]);
    }
    return pts;
}

function make_vertical_mesh(pts){
    const pts_v = [];
    
    // console.log("mvm: ");
    // console.log(pts);

    // console.log(pts.length);

    for(var i = 0; i < pts.length-1; ++i){
        pts_v.push(pts[i]);
        pts_v.push(pts[i+1]);
        var A1_dash = pts[i].clone();
        A1_dash.y = 0;
        pts_v.push(A1_dash);

        pts_v.push(A1_dash);
        var A2_dash = pts[i+1].clone();
        A2_dash.y = 0;
        pts_v.push(A2_dash);
        pts_v.push(pts[i+1]);
    }
    
    // console.log(pts_v);
    return pts_v;
}

function add_plane(s){
    const geometry = new THREE.PlaneGeometry(s, s, s, s);
    const material = new THREE.MeshBasicMaterial( { color: 0x052e07, side: THREE.DoubleSide } );
    const plane = new THREE.Mesh( geometry, material );
    plane.rotation.x = -Math.PI/2.0;
    scene.add(plane);
}

function add_line(pts){
    // console.log("line:");
    // console.log(pts);
    const geometry = new THREE.BufferGeometry().setFromPoints(pts);
    const material = new THREE.MeshBasicMaterial( {color: 0x0000ff} );
    const path = new THREE.Line(geometry, material);
    scene.add(path);
}

function add_points(pts){
    pts.forEach(p => {
        add_point(p);
    });
    //console.log(pts);
}

function add_point(pos){
    const geometry = new THREE.SphereGeometry(SCALE/10000.0, 12, 12);
    const material = new THREE.MeshBasicMaterial( {color: 0xff00ff} );
    const point = new THREE.Mesh(geometry, material);
    point.position.set(pos.x, pos.y, pos.z);
    scene.add(point);
}

function add_path(pts){
    
    // console.log("path:");
    // console.log(pts);
    //const pts_p = get_parallel(pts, 0.2); // normal vectors
    //const pts_pdash = [];
    // for(var i=0;i<20; ++i){
    //     var normal_line = [pts[i], pts_p[i]];
    //     add_point(pts[i]);
    //     add_point(pts_p[i]);
    //     // console.log(normal_line);
        // var pd = new THREE.Vector3();
        // pd.subVectors(pts_p[i], pts[i]);
        // pts_pdash.push(pd);
        // add_point(pd);
        // console.log(pd);

    //     const geometry = new THREE.BufferGeometry().setFromPoints(normal_line);
    //     const material = new THREE.MeshBasicMaterial( {color: 0x00ff00} );
    //     const normal = new THREE.Line(geometry, material);
    //     scene.add(normal);
        
    // }

    //console.log(pts_pdash);
    //add_line(pts_pdash);
    // const mesh_pts = make_ribbon_mesh(pts, pts_p);
    // console.log(pts);

    // const mesh_pts = pts;
    //const material = new THREE.MeshBasicMaterial( {color: 0xff0000} );
    //const line = new THREE.Line(geometry, material);
    
    const mesh_pts = make_vertical_mesh(pts);
    // console.log("mesh_pts:");
    // console.log(mesh_pts);
    const geometry = new THREE.BufferGeometry().setFromPoints(mesh_pts);
    const material = new THREE.MeshBasicMaterial( {color: 0xaaaaaa, side: THREE.DoubleSide } );
    const topo = new THREE.Mesh(geometry, material);
    scene.add(topo);
    // console.log("- Done -");
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
    stats.update();
}
