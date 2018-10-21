/*

each container has a grid and updates only on the same level

grid[x][y][0] is culling boolean

updateTransform:
if(has children){
loop over current visible cells to see which are still visible and disable others;
loop over new visible cells and enable, skip visible ones;
}
update my grid position in previous level
if(cell changed){
    remove myself from old cell
    add myself to new cell
}

*/