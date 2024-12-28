//Zackary Bowling

/*
Project Description: This project uses the seven tetrimino to create a meaningful shape
in the middle band of the program. The program will be divided into three bands.
The top band contains the tetrimino to use, the middle works as the area to build shapes, and 
the bottom band is how to delete tetrinimo 
*/


"use strict";

var is_mousedown = false;
var shift_key = false;
var held_mino = -1;
var t1, t2;


// Main Variables
var gl;
var points=[];
var colors=[];

var square_size = 0.025;
var offset = 2.045;
var death_line = -0.7;

// Mino Shape
var num_shapes = 0;

// Tetrimino Information
let num_minos = 0;
var pieces_index = [0];
var minos = [];
var mino_colors = [];
var pieces_orientation = [];

// Setting Color
var color_select = [
    vec4(0.75, 0.5, 0.0, 0.8),  
    vec4(.5, 0.0, 0.0, 0.8),  
    vec4(.5, .5, 0.0, 0.8),  
    vec4(0.0, .5, 0.0, 0.8),  
    vec4(0.0, 0.0, .5, 0.8),  
    vec4(.5, 0.0, .5, 0.8),  
    vec4(0, .5, .5, 0.8)   
];

// Drawing The Shapes
var t_block = [
    make_square_at_point,
    add_up,
    add_left,
    add_right
];

// Set Orientation 
var square_block = [
    make_square_at_point,
    add_up,
    add_left,
    add_top_left
];


var long_block = [
    make_square_at_point,
    add_up,
    add_down,
    add_outer_top
]; 

var right_step_block = [
    make_square_at_point,
    add_down,
    add_bottom_left,
    add_right
];

var left_step_block = [
    make_square_at_point,
    add_left,
    add_down,
    add_bottom_right
];  

var clockwise_l_block = [
    make_square_at_point,
    add_down,
    add_up,
    add_bottom_left
];

var counter_clockwise_l_block = [
    make_square_at_point,
    add_down,
    add_up,
    add_bottom_right
];

var tetrimino_templates = [
    counter_clockwise_l_block,
    left_step_block,
    clockwise_l_block,
    right_step_block,
    long_block,
    square_block,
    t_block
];

var boundary_color = vec4(0, 0, 0.55, 1);

window.onload = function init()
{
    var canvas = document.getElementById( "gl-canvas" );

    // Borders
    points.push(vec2(1,1), vec2(-1,1), vec2(-1,0.7), vec2(1,0.7));
    for(var i=0; i < 4; i++) colors.push(boundary_color);

    points.push(vec2(-1,-0.7), vec2(1,-0.7),vec2(1,-1), vec2(-1,-1));
    for(var i=0; i < 4; i++) colors.push(boundary_color);

    num_shapes = 2;

    // Top Tetriminos 
    var line = -0.65;
    for(var i = 0; i < tetrimino_templates.length; i++){
        draw_tetrimino(tetrimino_templates[i], line + (i * 0.2), 0.825, square_size, 0);
    }
    console.log(points);
    
    render();

    canvas.addEventListener("mouseup", function(event){
        is_mousedown = false;
        console.log("Up!");
        held_mino = -1;
      });

    canvas.addEventListener("mousedown", function(event){
        is_mousedown = true;
        var x = event.pageX - canvas.offsetLeft;
        var y = event.pageY - canvas.offsetTop;
        t1 = vec2(2*x/canvas.width-1, 
                    2*(canvas.height-y)/canvas.height-1);
        let click_loc = t1;
        var c_object = is_within_mino(click_loc[0], click_loc[1]);

        if(held_mino == -1 && c_object != -1) {
            let obj = c_object;
            if(c_object < 7){
                obj = num_minos;
            }
            held_mino = obj;
        }
        
        console.log(c_object);
        // Clockwise Rotation Set
        if(shift_key){
            if(c_object != -1 && c_object >= 7){
                rotate_counter_clockwise(c_object, click_loc[0], click_loc[1]);
                console.log(t1);
            }
        // Duplicating Tetrimino
        } else {
            if(c_object != -1 && c_object < 7){
                draw_tetrimino(minos[c_object], t1[0], t1[1], square_size, 0);
            }
        }
      });

    canvas.addEventListener("mousemove", function(event){
        if (is_mousedown) {
          var x = event.pageX - canvas.offsetLeft;
          var y = event.pageY - canvas.offsetTop;

          t2 = vec2(2*x/canvas.width-1, 2*(canvas.height-y)/canvas.height-1);
          
          var c_object = is_within_mino(t1[0], t1[1]);
              
          if(c_object != -1 && held_mino != -1){
            move_mino_x(held_mino, t2[0] - t1[0]);
            move_mino_y(held_mino, t2[1] - t1[1]);
          }

          t1 = t2;
        }
    } );

    document.addEventListener("keydown", function(event){
        if(event.key === 'Shift'){
            shift_key = true;
        }
    });
    document.addEventListener("keyup", function(event){
        if(event.key === 'Shift'){
            shift_key = false;
        }
    });


};

function move_mino_x(mino_idx, dist){
    if(minos[mino_idx] === -1  || mino_idx < 7) return;  
    let star = pieces_index[mino_idx];
    for(var i = star; i < star + 16; i++){
        points[i][0] = points[i][0] + dist;
    }
    render();
}

function move_mino_y(mino_idx, dist){
    if(minos[mino_idx] === -1 || mino_idx < 7) return; 
    var star = pieces_index[mino_idx];
    for(var i = star; i < star + 16; i++){
        points[i][1] = points[i][1] + dist;
    }

    if(is_mino_under_line(mino_idx, points)){
        delete_tetrimino(mino_idx);
    }
    render();
}
// Checks Bounds of Tetrimino
function is_within_mino(x, y){
    for(var i = 0; i < minos.length; i++){
        var p_idx = pieces_index[i];
        for (var j = p_idx; j < p_idx + 16; j = j + 4){
            var p1 = points[j];   
            var p2 = points[j+1]; 
            var p3 = points[j+2]; 
            var p4 = points[j+3]; 

            let bigY, bigX, lilY, lilX;

            bigY = Math.max(p1[1], p2[1], p3[1], p4[1]);
            bigX = Math.max(p1[0], p2[0], p3[0], p4[0]);
            
            lilY = Math.min(p1[1], p2[1], p3[1], p4[1]);
            lilX = Math.min(p1[0], p2[0], p3[0], p4[0]);

            // Check Y
            if(y < bigY && y > lilY){
                // Check X
                if(x < bigX && x > lilX){
                    return i;
                }
            }
        }
    }
    return -1;
    
}

// Counter-clockwise Rotation Function
function rotate_counter_clockwise(mino_idx,x,y){
        var p_idx = pieces_index[mino_idx];
        for (var j = p_idx; j < p_idx + 16; j = j + 4){
            var p1 = points[j];
            var p2 = points[j+1];
            var p3 = points[j+2]; 
            var p4 = points[j+3]; 


            let bigY, bigX, lilY, lilX;

            bigY = Math.max(p1[1], p2[1], p3[1], p4[1]);
            bigX = Math.max(p1[0], p2[0], p3[0], p4[0]);

            lilY = Math.min(p1[1], p2[1], p3[1], p4[1]);
            lilX = Math.min(p1[0], p2[0], p3[0], p4[0]);

            if(y <= bigY && y >= lilY){
                if(x <= bigX && x >= lilX){
                    rotate_about_a_point(((bigX + lilX)/2), ((bigY + lilY)/2), mino_idx);
                    if(is_mino_under_line(mino_idx, points)) delete_tetrimino(mino_idx);
                    return;
                }
            }
    }
}
function rotate_about_a_point(x,y,mino_idx){
    var start = pieces_index[mino_idx];
    console.log(["Rotating ", mino_idx]);
    for(var i = start; i < start + 16; i++){
        var temp_y, temp_x;

        temp_x = points[i][0] - x;
        temp_y = points[i][1] - y;
        
        points[i][0] =  -temp_y + x;
        points[i][1] =  temp_x + y;
    }

    render();

}
// Drawing Squares
function add_up(x,y,size, color){
    make_square_at_point(x,y + size*offset, size, color);
}
function add_down(x,y,size, color){
    make_square_at_point(x,y - size*offset, size, color);
}
function add_right(x,y,size, color){
    make_square_at_point(x + size*offset,y, size, color);
}
function add_left(x,y,size, color){
    make_square_at_point(x - size*offset,y, size, color);
}
function add_bottom_left(x,y,size, color){
    make_square_at_point(x - size*offset, y - size*offset, size, color);
}
function add_bottom_right(x,y,size, color){
    make_square_at_point(x + size*offset, y - size*offset, size, color);
}
function add_top_left(x,y,size, color){
    make_square_at_point(x - size*offset, y + size*offset, size, color);
}
function add_top_right(x,y,size, color){
    make_square_at_point(x + size*offset, y + size*offset, size, color);
}
function add_outer_top(x,y,size, color){
    make_square_at_point(x, y + size*offset*2, size, color);
}
function add_outer_right(x,y,size, color){
    make_square_at_point(x + size*offset*2, y, size, color);
}
function add_outer_left(x,y,size, color){
    make_square_at_point(x - size*offset*2, y, size, color);
}
function add_outer_bottom(x,y,size, color){
    make_square_at_point(x, y - size*offset*2, size, color);
}

// Checking If Under Delete Line
function is_mino_under_line(mino_idx, p){
    var start = pieces_index[mino_idx];
    for (var i = start; i < start + 16; i++){
        var y = p[i][1];
        if(y <= death_line) {
            return true;
        }
    }
    return false;
}

// Deleting Tetrimino
function delete_tetrimino(mino_idx){  
    var p_start = pieces_index[mino_idx];

    for (var i = p_start; i < p_start + 16; i++){
        colors[i] = colors[pieces_index[num_minos-1] + i - p_start];
        points[i] = points[pieces_index[num_minos-1] + i - p_start];
    }
    minos[mino_idx] = mino_idx[num_minos-1];
    
    colors.length = colors.length - 16;
    points.length = points.length - 16;
    num_shapes = num_shapes - 4;

    minos.length = minos.length - 1;
    pieces_index.length = pieces_index.length - 1;
    
    num_minos = num_minos - 1;
    held_mino = -1;

    render();
}

// Color Function
function get_color(instructions){
    let color = vec4(1,1,1,1);
    if(instructions === counter_clockwise_l_block) color = color_select[0];
    if(instructions === left_step_block) color = color_select[1];
    if(instructions === square_block) color = color_select[2];
    if(instructions === right_step_block) color = color_select[3];
    if(instructions === clockwise_l_block) color = color_select[4];
    if(instructions === t_block) color = color_select[5];
    if(instructions === long_block) color = color_select[6];
    
    return color;
}

// Instructions For Tetrimino Drawing
function draw_tetrimino(instructions, x, y, size,orient = 0){
    pieces_index[num_minos] = 8 + num_minos * 16;
    minos[num_minos] = instructions;

    console.log(num_minos);
    let color = get_color(instructions);

    for(var i = 0 ; i < instructions.length ; i++){
        instructions[i](x,y,size,color);
    }

    num_minos = num_minos + 1;  
    
    render();
}                 



function make_square_at_point(x, y, size, color){
    num_shapes++;

    points.push(vec2(x + size, y + size)); 
    points.push(vec2(x - size, y + size));
    points.push(vec2(x - size, y - size)); 
    points.push(vec2(x + size, y - size)); 
    
    colors.push(color);
    colors.push(color);
    colors.push(color);
    colors.push(color);
}

function render() {
    var canvas = document.getElementById("gl-canvas");

    gl = canvas.getContext('webgl2');
    if (!gl) { alert( "WebGL 2.0 isn't available" ); }

    gl.viewport(0, 0, canvas.width, canvas.height );
    gl.clearColor(0.86, 0.08, 0.24, 0.5);



    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);
    
    var aPosition = gl.getAttribLocation( program, "aPosition" );
    gl.vertexAttribPointer( aPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( aPosition );

    var cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );

    var colorLoc = gl.getAttribLocation( program, "aColor");
    gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(colorLoc);

    gl.clear( gl.COLOR_BUFFER_BIT );

    for(var i=0; i < num_shapes; i++) {
        gl.drawArrays(gl.TRIANGLE_FAN, i*4, 4);
    }
}
