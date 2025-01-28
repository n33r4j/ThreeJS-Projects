import { defineConfig } from "vite";

export default defineConfig({
    // base: '/threejs-projects/courseview', // the gh pages repo name, keep commented for dev
    // See https://www.youtube.com/watch?v=yo2bMGnIKE8
})

// TODO:
// - Optimize Meshes for better FPS
//      - Only getting around 10 FPS on some courses.
// - Add a trackbar at the bottom to see where you are in the course
// - Add km markers on the course [O]
// - Add points of interest on the course []
// - Add a dropdown for existing courses [O]