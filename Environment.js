
// biar jd variable global
var GL;
function normalizeScreen(x, y, width, height) {
    var nx = (2 * x) / width - 1;
    var ny = (-2 * y) / height + 1;
  
    return [nx, ny];
  }
  
  function generateBSpline(controlPoint, m, degree, x1, y1, z1, r, g, b) { //titik "edge" kayak di AI
    //m = jumlah titik dalam 1 garis
    //degree = interpolasi/dimensi
    var curves = [];
    var knotVector = []
    var n = controlPoint.length/2;
   
    // Calculate the knot values based on the degree and number of control points
    for (var i = 0; i < n + degree+1; i++) {
        if (i < degree + 1) {
            knotVector.push(0);
        } else if (i >= n) {
            knotVector.push(n - degree);
        } else {
            knotVector.push(i - degree);
        }
    }

    var basisFunc = function(i,j,t){
        if (j == 0){
            if (knotVector[i] <= t && t < (knotVector[(i+1)])){ 
              return 1;
            } else{
              return 0;
            }
        }
   
        var den1 = knotVector[i + j] - knotVector[i];
        var den2 = knotVector[i + j + 1] - knotVector[i + 1];
   
        var term1 = 0;
        var term2 = 0;
   
   
        if (den1 != 0 && !isNaN(den1)) {
          term1 = ((t - knotVector[i]) / den1) * basisFunc(i,j-1,t);
        }
   
        if (den2 != 0 && !isNaN(den2)) {
          term2 = ((knotVector[i + j + 1] - t) / den2) * basisFunc(i+1,j-1,t);
        }
   
        return term1 + term2;
    }
   
   
    for(var t=0;t<m;t++){
      var x = 0;
      var y = 0;
   
      var u = (t/m * (knotVector[controlPoint.length/2] - knotVector[degree]) ) + knotVector[degree];
   
      //C(t)
      for(var key = 0;key<n;key++){
   
        var C = basisFunc(key,degree,u);
        //console.log(C);
        x += (controlPoint[key*2] * C);
        y += (controlPoint[key*2+1] * C);
        //console.log(t+" "+degree+" "+x+" "+y+" "+C);
      }
      curves.push(x+x1);
      curves.push(y+y1);
      curves.push(z1);
      curves.push(r);
      curves.push(g);
      curves.push(b);
    }
    console.log(curves)
    return curves;
}

class myObject{
    object_vertex = [];
    // ini bebas yang var tp GL hrs sama
    OBJECT_VERTEX = GL.createBuffer();
    object_faces = [];
    OBJECT_FACES= GL.createBuffer();
    // kasih anak
    child = [];
    translasi = [0, 0, 0];
    rotasi = [0, 0, 0];
    scale = [1, 1, 1];
   
    shader_vertex_source;
    // vColor hrs sama atas dan bawah kalau ga ga jalan, Fragcolor buat panggil warnanya
    shader_fragment_source;

    // ini template diambil aja 
    compile_shader = function(source, type, typeString){
        var shader = GL.createShader(type);
        GL.shaderSource(shader, source);
        GL.compileShader(shader);
        if (!GL.getShaderParameter(shader, GL.COMPILE_STATUS)) {
            alert("ERROR IN" + typeString + "SHADER: " + GL.getShaderInfoLog(shader));
            return false;
        }
        return shader;
    };

    shader_vertex ;
    shader_fragment;

    SHADER_PROGRAM;
    _Pmatrix;
    _Vmatrix;
    _Mmatrix;
    _color;
    _position;
    MOVEMATRIX = LIBS.get_I4();

    constructor(object_vertex, object_faces,shader_vertex_source,shader_fragment_source){
        this.object_vertex = object_vertex;
        this.object_faces = object_faces;
        this.shader_vertex_source = shader_vertex_source;
        this.shader_fragment_source = shader_fragment_source;
        this.shader_vertex = this.compile_shader(this.shader_vertex_source, GL.VERTEX_SHADER, "VERTEX");
        this.shader_fragment = this.compile_shader(this.shader_fragment_source,GL.FRAGMENT_SHADER, "FRAGMENT");
   
        this.SHADER_PROGRAM = GL.createProgram();
        GL.attachShader(this.SHADER_PROGRAM,this.shader_vertex);
        GL.attachShader(this.SHADER_PROGRAM,this.shader_fragment);
   
        GL.linkProgram(this.SHADER_PROGRAM);
   
        this._Pmatrix = GL.getUniformLocation(this.SHADER_PROGRAM, "Pmatrix");
        this._Vmatrix = GL.getUniformLocation(this.SHADER_PROGRAM, "Vmatrix");
        this. _Mmatrix = GL.getUniformLocation(this.SHADER_PROGRAM, "Mmatrix");
   
        this._color = GL.getAttribLocation(this.SHADER_PROGRAM, "color");
        this._position = GL.getAttribLocation(this.SHADER_PROGRAM, "position");
   
        GL.enableVertexAttribArray(this._color);
        GL.enableVertexAttribArray(this._position);
   
        GL.useProgram(this.SHADER_PROGRAM);
        this.initializeObject();
    }

    initializeObject(){
        // cara panggil ksh tau untuk menghandle tipe data tipenya float
        GL.bindBuffer(GL.ARRAY_BUFFER, this.OBJECT_VERTEX);
        // KSH TAU KOMPUTER DATANYA YANG MANA 
        GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(this.object_vertex), GL.STATIC_DRAW);
        // kasih tau komputer gambarnya urutannya gmn misal 0 1 2 , hrs berlawanan jarum jam untuk gambar

        GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER,this.OBJECT_FACES);
        // DIKSH TAU INFORMASI DATA YYG MAU DIHANDLE
        // DATA BUKAN FLOAT INTEGER KRN INDEX PASTI KYK 1 2 3
        GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.object_faces), GL.STATIC_DRAW);
    }

    setUniform4(PROJMATRIX,VIEWMATRIX){
        GL.useProgram(this.SHADER_PROGRAM); // ini bentukkan vlass untuk membuat objek ?
        GL.uniformMatrix4fv(this._Pmatrix, false, PROJMATRIX);
        GL.uniformMatrix4fv(this._Vmatrix, false, VIEWMATRIX);
        GL.uniformMatrix4fv(this._Mmatrix, false, this.MOVEMATRIX);
        for (var index = 0; index < this.child.length; index++) {
            this.child[index].setUniform4(PROJMATRIX,VIEWMATRIX);
        }
    }

    draw(obj_curve){
        GL.useProgram(this.SHADER_PROGRAM);
        GL.bindBuffer(GL.ARRAY_BUFFER,this.OBJECT_VERTEX);
        GL.vertexAttribPointer(this._position,3,GL.FLOAT,false,4*(3+3), 0);
        GL.vertexAttribPointer(this._color,3,GL.FLOAT,false,4*(3+3), 3*4);
        GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.OBJECT_FACES);
        GL.drawElements(GL.TRIANGLES,this.object_faces.length, GL.UNSIGNED_SHORT,0);

        for(var i = 0; i < this.child.length;i++){
            for(var j = 0; j < obj_curve.length; j++) {
                if(this.child[i] == obj_curve[j]) {
                    this.child[i].drawCurves(obj_curve[j]);
                }
                else {
                    this.child[i].draw(obj_curve[j]);
                }
            }
        }
    }

    drawCurves(obj_curve) {
        GL.useProgram(this.SHADER_PROGRAM);
        GL.bindBuffer(GL.ARRAY_BUFFER, this.OBJECT_VERTEX);
        GL.vertexAttribPointer(this._position, 3, GL.FLOAT, false, 4*(3+3), 0);
        GL.vertexAttribPointer(this._color, 3, GL.FLOAT, false, 4*(3+3), 3*4);
        GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.OBJECT_FACES);
        GL.drawElements(GL.LINE_STRIP, this.object_faces.length, GL.UNSIGNED_SHORT, 0);

        for(var i = 0; i < this.child.length;i++){
            for(var j = 0; j < obj_curve.length; j++) {
                if(this.child[i] == obj_curve[j]) {
                    this.child[i].drawCurves(obj_curve[j]);
                }
                else {
                    this.child[i].draw(obj_curve[j]);
                }
            }
        }
    }

    // buat anak pernakan
    addChild(child){
        this.child.push(child);
        // tiap kali rotate juga anaknya draw anaknya juga
    }

    rotateAll(PHI, THETA, R){
        this.rotasi = [this.rotasi[0] + PHI, this.rotasi[1] + THETA, this.rotasi[2] + R];
        this.child.forEach(element => {
            element.rotateAll(PHI, THETA, R)
        });
    };

    translateAll(a, b, c) {
        this.translasi = [this.translasi[0] + a, this.translasi[1] + b, this.translasi[2] + c];
        this.child.forEach(element => {
            element.translateAll(a, b, c);
        });
    };

    scalingAll(c) {
        this.translasi = [this.scale[0] * c, this.scale[1] * c, this.scale[2] * c];
        this.child.forEach(element => {
            element.translateAll(c);
        });
    }

    origin(phi, theta, r) {
        var rot = glMatrix.quat.fromEuler(glMatrix.quat.create(), this.rotasi[0] + phi, this.rotasi[1] + theta, this.rotasi[2] + r);
        var trans = glMatrix.vec3.fromValues(this.translasi[0], this.translasi[1], this.translasi[2]);
        var scale = glMatrix.vec3.fromValues(this.scale[0], this.scale[1], this.scale[2]);
        var ori = glMatrix.vec3.fromValues(-this.translasi[0], -this.translasi[1], -this.translasi[2]);
        glMatrix.mat4.fromRotationTranslationScaleOrigin(this.MOVEMATRIX, rot, trans, scale, ori);

        for(var i = 0; i < this.child.length; i++) {
            this.child[i].origin(phi, theta, r);
        }
    }
    traansateSemua(c){
        glMatrix.mat4.translate(this.MOVEMATRIX, this.MOVEMATRIX,c);
        this.child.forEach(element => {
            element.translateAll(c);
        });
    };
};

function Torus(minorRadius, majorRadius, a, b, red, green, blue) {
    var object = [];
    var x, y, z, xy;                       // vertex position

    var sectorCount = 36;
    var sideCount = 18;
    var sectorStep = 2 * Math.PI / sectorCount;
    var sideStep = 2 * Math.PI / sideCount;
    var sectorAngle, sideAngle;

    for (var i = 0; i <= sideCount; ++i) {
        // start the tube side from the inside where sideAngle = pi
        sideAngle = Math.PI - i * sideStep;             // starting from pi to -pi
        xy = minorRadius * Math.cos(sideAngle);         // r * cos(u)
        z = b * minorRadius * Math.sin(sideAngle);          // r * sin(u)

        // add (sectorCount+1) vertices per side
        // the first and last vertices have same position and normal,
        // but different tex coords
        for (var j = 0; j <= sectorCount; ++j) {
            sectorAngle = j * sectorStep;           // starting from 0 to 2pi

            // tmp x and y to compute normal vector
            x = a * xy * Math.cos(sectorAngle);
            y = a * xy * Math.sin(sectorAngle);

            // shift x & y, and vertex position
            x += majorRadius * Math.cos(sectorAngle);   // (R + r * cos(u)) * cos(v)
            y += majorRadius * Math.sin(sectorAngle);   // (R + r * cos(u)) * sin(v)
            object.push(x);
            object.push(y);
            object.push(z);
            object.push(red);
            object.push(green);
            object.push(blue);
        }
    }

    var objectface = [];
    var k1, k2;
    for(var i = 0; i < sideCount; ++i) {
        k1 = i * (sectorCount + 1);     // beginning of current side
        k2 = k1 + sectorCount + 1;      // beginning of next side

        for(var j = 0; j < sectorCount; ++j, ++k1, ++k2) {
            // 2 triangles per sector
            objectface.push(k1);                 // k1---k2---k1+1
            objectface.push(k2);
            objectface.push(k1 + 1);
            objectface.push(k1 + 1);             // k1+1---k2---k2+1
            objectface.push(k2);
            objectface.push(k2 + 1);
        }
    }

    return {object,objectface};
};

function Sphere(rad,sector,a,b,c, red,green,blue ){
    var object = [];
    var x, y, z, xy;                              // vertex position
    var nx, ny, nz
    var radius = rad;
    var lengthInv = 1.0 / radius;                 // vertex normal
    var s, t;                                     // vertex texCoord

    var sectorCount = 30;
    var stackCount = 30;
    var sectorStep = sector * Math.PI / sectorCount;
    var stackStep = Math.PI / stackCount;
    var sectorAngle, stackAngle;

for(var i = 0; i <= stackCount; ++i)
{
    stackAngle = Math.PI / 2 - i * stackStep;        // starting from pi/2 to -pi/2
    xy = radius * Math.cos(stackAngle);             // r * cos(u)
    z = a * radius * Math.sin(stackAngle);              // r * sin(u)

    // add (sectorCount+1) vertices per stack
    // first and last vertices have same position and normal, but different tex coords
    for(var j = 0; j <= sectorCount; ++j)
    {
        sectorAngle = j * sectorStep;           // starting from 0 to 2pi

        // vertex position (x, y, z)
        x = c * xy * Math.cos(sectorAngle);             // r * cos(u) * cos(v)
        y =  b * xy * Math.sin(sectorAngle);             // r * cos(u) * sin(v)
        object.push(x);
        object.push(y);
        object.push(z);
        object.push(red);
        object.push(green);
        object.push(blue);
    }
};
    
    var objectface = [];

    var k1, k2;
for(var i = 0; i < stackCount; ++i)
{
    k1 = i * (sectorCount + 1);     // beginning of current stack
    k2 = k1 + sectorCount + 1;      // beginning of next stack
// jika dibagi 2 maka akan dilakukan sectorcount/2
    for(var j = 0; j < sectorCount; ++j, ++k1, ++k2)
    {
        // 2 triangles per sector excluding first and last stacks
        // k1 => k2 => k1+1
        if(i != 0)
        {
            objectface.push(k1);
            objectface.push(k2);
            objectface.push(k1 + 1);
        }

        // k1+1 => k2 => k2+1
        if(i != (stackCount-1))
        {
            objectface.push(k1 + 1);
            objectface.push(k2);
            objectface.push(k2 + 1);
        }

        // store indices for lines
        // vertical lines for all stacks, k1 => k2
        // lineIndices.push_back(k1);
        // lineIndices.push_back(k2);
        // if(i != 0)  // horizontal lines except 1st stack, k1 => k+1
        // {
        //     triangle_faces.push(k1);
        //     triangle_faces.push(k1 + 1);
        // }
    }
};

return {object,objectface};
};


function ellipticparaloid(a,b,c,red,green,blue){
    var object = [];
    var i,j;
	i=0;
	for(var u=-Math.PI;u<=Math.PI;u+=Math.PI/180)
	{	j=0;
		for(var v=-Math.PI/2;v<Math.PI/2;v+=Math.PI/180)
		{	object.push(a * (v)* Math.cos(u));
			object.push(b * (v)* Math.sin(u));
			object.push(c* v * v);
            object.push(red);
            object.push(green);
            object.push(blue);
			j++;
		}
		i++;
	};
    var objectface = [];
    for (i = 0 ; i <= object.length ; i++){
        objectface.push(0);
        objectface.push(i+1);
        objectface.push(i);
    };
    return {object,objectface};

};

function kerucut (rad, length, red, green, blue, r, g, b){
    var circle_vertex = [];
        var jumlah = 360;
        for (var i = 0 ; i <= jumlah ; i++){
           circle_vertex.push(rad * Math.cos(i * Math.PI/180));
           circle_vertex.push(rad * Math.sin(i * Math.PI/180));
           circle_vertex.push(0);
           circle_vertex.push(red);
           circle_vertex.push(green);
           circle_vertex.push(blue);
        };
    
        //Titik tengah
        circle_vertex.push(0);
        circle_vertex.push(0);
        circle_vertex.push(length);
        circle_vertex.push(r);
        circle_vertex.push(g);
        circle_vertex.push(b);
    
    
        var circle_faces = [];
        var jumlah2 = 360;
        //Buat Alas
        for (var i = 0 ; i <= jumlah2 ; i++){
            circle_faces.push(i);
            circle_faces.push(i + 1);
            circle_faces.push(0);
        };
    
        //Buat Sisinya
        for (var i = 0 ; i <= jumlah2 ; i++){
            circle_faces.push(i);
            circle_faces.push(i + 1);
            circle_faces.push(361);
        };
    
        return{circle_faces, circle_vertex};
    };

    function tabung(rad1, rad2, length, red, green, blue) {
        var circle_vertex = [];
        var jumlah = 360;
    
        // LINGKARAN ATAS
        for (var i = 0; i <= jumlah; i++) {
            circle_vertex.push(rad1 * Math.cos(i * Math.PI / 180));
            circle_vertex.push(rad1 * Math.sin(i * Math.PI / 180));
            circle_vertex.push(0);
            circle_vertex.push(red);
            circle_vertex.push(green);
            circle_vertex.push(blue);
        }
    
        // LINGKARAN BAWAH 
        for (var i = 0; i <= jumlah; i++) {
            circle_vertex.push(rad2 * Math.cos(i * Math.PI / 180));
            circle_vertex.push(rad2 * Math.sin(i * Math.PI / 180));
            circle_vertex.push(length);
            circle_vertex.push(red);
            circle_vertex.push(green);
            circle_vertex.push(blue);
        }
    
    
        // untuk titik ditengah atas 
        circle_vertex.push(0);
        circle_vertex.push(0);
        circle_vertex.push(0);
    
        circle_vertex.push(red);
        circle_vertex.push(green);
        circle_vertex.push(blue);
    
        // untuk titik ditengah bawah
        circle_vertex.push(0);
        circle_vertex.push(0);
        circle_vertex.push(length);
    
        circle_vertex.push(red);
        circle_vertex.push(green);
        circle_vertex.push(blue);
    
        // faces
        var circle_faces = [];
        var jumlah2 = 360;
        // LINGKARAN DIGAMBAR
        for (var i = 0 ; i <= jumlah2 ; i++){
            circle_faces.push(i); 
            circle_faces.push(i+1);
            circle_faces.push(722);   
        };
    
        // ALAS ATAS
        for (var i = 361 ; i <= 721 ; i++){
            circle_faces.push(i);
            circle_faces.push(i+1);
            circle_faces.push(723);
        };
    
        // LOOP 2 SEGITIGA 
        for (var i = 0 ; i <= jumlah2 ; i++){
            circle_faces.push(i);
            circle_faces.push(i + 361);
            circle_faces.push(i+1);
            circle_faces.push(362+i);
            circle_faces.push(i + 361);
            circle_faces.push(i+1);   
        };
    
        return{circle_faces,circle_vertex};
    };

function main(){
    var CANVAS = document.getElementById("mycanvas");

    CANVAS.width = window.innerWidth;
    CANVAS.height = window.innerHeight;
    // supaya nilainya mendekati nol , jd hrs kurang 1 , ini buat ngurangi dx dan dy
    var AMORIZATION = 0.95;

    var x_prev, y_prev;
    var drag = false;
    var THETA = 0, PHI = 0;
    // buat ksh perlambatan
    var dX =0, dY=0;

    var mouseDown = function(e) {
        drag = true;
        x_prev = e.pageX;
        y_prev = e.pageY;
        e.preventDefault();
        return false;
    }

    var mouseUp = function(e) {
        drag = false;
    }

    var mouseMove = function(e) {
        if(!drag) return false;


        dX = (e.pageX - x_prev) * 2 * Math.PI / CANVAS.width;
        dY = (e.pageY - y_prev) * 2 * Math.PI / CANVAS.height;
        THETA += dX ; //rumus aslinya: dX * 2 * Math.PI, dibagi hanya untuk normalisasi saja
        PHI += dY ;

        //untuk mengupdate perpindahan mousenya
        x_prev = e.pageX;
        y_prev = e.pageY;
        e.preventDefault();
    }

    CANVAS.addEventListener("mousedown", mouseDown, false);
    CANVAS.addEventListener("mouseup", mouseUp, false);
    CANVAS.addEventListener("mouseout", mouseUp, false);
    CANVAS.addEventListener("mousemove", mouseMove, false);

   
    try {
        GL = CANVAS.getContext("webgl" , {antialias: false})

    }
    catch (error){
        alert("WebGL context cannot be initialized");
        return false;
    }

    // SHADERS
    // bs bikin 2 isi beda jumlah shaders terserah maunya kita, color yang handle fragment , hrs msk vertex, kita pindahin pake
    // variable khusus yaitu buat mindahin out, in masukkin. vColor position dll bole ganti krn nama variable.
    // kenapa vec4 itu 3 dimensi 
    var shader_vertex_source = `
    attribute vec3 position;
    attribute vec3 color; 

    uniform mat4 Pmatrix;
    uniform mat4 Vmatrix;
    uniform mat4 Mmatrix;

    varying vec3 vColor;
    void main(void){
        gl_Position = Pmatrix * Vmatrix * Mmatrix * vec4(position, 1.0);
        vColor = color;

    }`;
    // vColor hrs sama atas dan bawah kalau ga ga jalan, Fragcolor buat panggil warnanya
    var shader_fragment_source =`precision mediump float;
    varying vec3 vColor;
    void main(void){
        gl_FragColor = vec4(vColor, 1.0);
    }`;
    // ===================================================  ENVIRONMENT OBJECT ========================
    // BAGIAN BULAN
    var bulan = Sphere(2.5, 2, 0.5, 0.9, 1, 248/255, 253/255, 157/255);
    var pumpkin = Sphere(0.5,2,1,1,1,232/255, 138/255, 7/255);
    var pumpkinBesar = Sphere(1.0,2,1,1,1,232/255, 138/255, 7/255);
    var grave = Sphere(0.5,2,1.5,2,1,66/255, 65/255, 63/255)
    var graveBesar = Sphere(1.0,2,1.5,2,1,69/255, 73/255, 61/255)
    // BAGIAN TANAH 
        var triangle_vertex = [
    

            -30, -3, -15,    59/255, 46/255, 35/255, 
            30, -3, -15,    59/255, 46/255, 35/255, 
            30,  3, -15,    59/255, 46/255, 35/255, 
            -30,  3, -15,    59/255, 46/255, 35/255, 
     
            -30, -3, 15,     59/255, 46/255, 35/255, 
            30, -3, 15,     59/255, 46/255, 35/255, 
            30,  3, 15,     59/255, 46/255, 35/255, 
            -30,  3, 15,     59/255, 46/255, 35/255, 
     
            -30, -3, -15,    59/255, 46/255, 35/255, 
            -30,  3, -15,    59/255, 46/255, 35/255, 
            -30,  3,  15,    59/255, 46/255, 35/255, 
            -30, -3,  15,    59/255, 46/255, 35/255, 
     
            30, -3, -15,     59/255, 46/255, 35/255, 
            30,  3, -15,     59/255, 46/255, 35/255, 
            30,  3,  15,     59/255, 46/255, 35/255, 
            30, -3,  15,     59/255, 46/255, 35/255, 
     
            -30, -3, -15,    59/255, 46/255, 35/255, 
            -30, -3,  15,    59/255, 46/255, 35/255, 
            30, -3,  15,    59/255, 46/255, 35/255, 
            30, -3, -15,    59/255, 46/255, 35/255, 
     
            -30, 3, -15,     59/255, 46/255, 35/255, 
            -30, 3,  15,     59/255, 46/255, 35/255, 
            30, 3,  15,     59/255, 46/255, 35/255, 
            30, 3, -15,     59/255, 46/255, 35/255, 
        ];

    var triangle_elements = [
        0, 1, 2,
        0, 2, 3,
   
        4, 5, 6,
        4, 6, 7,
   
        8, 9, 10,
        8, 10, 11,
   
        12, 13, 14,
        12, 14, 15,
   
        16, 17, 18,
        16, 18, 19,
   
        20, 21, 22,
        20, 22, 23
    ];

    var triangle1_vertex = [
    

        -1, -6, -1,    77/255, 74/255, 74/255, 
        1, -6, -1,    77/255, 74/255, 74/255, 
        1,  6, -1,    77/255, 74/255, 74/255, 
        -1,  6, -1,    77/255, 74/255, 74/255, 
 
        -1, -6, 1,     77/255, 74/255, 74/255, 
        1, -6, 1,     77/255, 74/255, 74/255, 
        1,  6, 1,     77/255, 74/255, 74/255, 
        -1,  6, 1,     77/255, 74/255, 74/255, 
 
        -1, -6, -1,    77/255, 74/255, 74/255, 
        -1,  6, -1,    77/255, 74/255, 74/255, 
        -1,  6,  1,    77/255, 74/255, 74/255, 
        -1, -6,  1,    77/255, 74/255, 74/255, 
 
        1, -6, -1,     77/255, 74/255, 74/255, 
        1,  6, -1,     77/255, 74/255, 74/255, 
        1,  6,  1,     77/255, 74/255, 74/255, 
        1, -6,  1,     77/255, 74/255, 74/255, 
 
        -1, -6, -1,    77/255, 74/255, 74/255, 
        -1, -6,  1,    77/255, 74/255, 74/255, 
        1, -6,  1,    77/255, 74/255, 74/255, 
        1, -6, -1,    77/255, 74/255, 74/255, 
 
        -1, 6, -1,     77/255, 74/255, 74/255, 
        -1, 6,  1,     77/255, 74/255, 74/255, 
        1, 6,  1,     77/255, 74/255, 74/255, 
        1, 6, -1,     77/255, 74/255, 74/255
    ];

var triangle1_elements = [
    0, 1, 2,
    0, 2, 4,

    4, 5, 6,
    4, 6, 7,

    8, 9, 10,
    8, 10, 11,

    12, 13, 14,
    12, 14, 15,

    16, 17, 18,
    16, 18, 19,

    20, 21, 22,
    20, 22, 23
];

var triangle2_vertex = [
    

    -6, -1, -5,    77/255, 74/255, 74/255, 
    6, -1, -5,    77/255, 74/255, 74/255, 
    6,  1, -5,    77/255, 74/255, 74/255, 
    -6,  1, -5,    77/255, 74/255, 74/255, 

    -6, -1, 5,     77/255, 74/255, 74/255, 
    6, -1, 5,     77/255, 74/255, 74/255, 
    6,  1, 5,     77/255, 74/255, 74/255, 
    -6,  1, 5,     77/255, 74/255, 74/255, 

    -6, -1, -5,    77/255, 74/255, 74/255, 
    -6,  1, -5,    77/255, 74/255, 74/255, 
    -6,  1,  5,    77/255, 74/255, 74/255, 
    -6, -1,  5,    77/255, 74/255, 74/255, 

    6, -1, -5,     77/255, 74/255, 74/255, 
    6,  1, -5,     77/255, 74/255, 74/255, 
    6,  1,  5,     77/255, 74/255, 74/255, 
    6, -1,  5,     77/255, 74/255, 74/255, 

    -6, -1, -5,    77/255, 74/255, 74/255, 
    -6, -1,  5,    77/255, 74/255, 74/255, 
    6, -1,  5,    77/255, 74/255, 74/255, 
    6, -1, -5,    77/255, 74/255, 74/255, 

    -6, 1, -5,     77/255, 74/255, 74/255, 
    -6, 1,  5,     77/255, 74/255, 74/255, 
    6, 1,  5,     77/255, 74/255, 74/255, 
    6, 1, -5,     77/255, 74/255, 74/255
];

var triangle2_elements = [
0, 1, 2,
0, 2, 4,

4, 5, 6,
4, 6, 7,

8, 9, 10,
8, 10, 11,

12, 13, 14,
12, 14, 15,

16, 17, 18,
16, 18, 19,

20, 21, 22,
20, 22, 23
];

var triangle3_vertex = [
    

    -2, -1, -2,    77/255, 74/255, 74/255, 
    2, -1, -2,    77/255, 74/255, 74/255, 
    2,  1, -2,    77/255, 74/255, 74/255, 
    -2,  1, -5,    77/255, 74/255, 74/255, 

    -2, -1, 2,     77/255, 74/255, 74/255, 
    2, -1, 2,     77/255, 74/255, 74/255, 
    2,  1, 2,     77/255, 74/255, 74/255, 
    -2,  1, 2,     77/255, 74/255, 74/255, 

    -2, -1, -2,    77/255, 74/255, 74/255, 
    -2,  1, -2,    77/255, 74/255, 74/255, 
    -2,  1,  2,    77/255, 74/255, 74/255, 
    -2, -1,  2,    77/255, 74/255, 74/255, 

    2, -1, -2,     77/255, 74/255, 74/255, 
    2,  1, -2,     77/255, 74/255, 74/255, 
    2,  1,  2,     77/255, 74/255, 74/255, 
    2, -1,  2,     77/255, 74/255, 74/255, 

    -2, -1, -2,    77/255, 74/255, 74/255, 
    -2, -1,  2,    77/255, 74/255, 74/255, 
    2, -1,  2,    77/255, 74/255, 74/255, 
    2, -1, -2,    77/255, 74/255, 74/255, 

    -2, 1, -2,     77/255, 74/255, 74/255, 
    -2, 1,  2,     77/255, 74/255, 74/255, 
    2, 1,  2,     77/255, 74/255, 74/255, 
    2, 1, -2,     77/255, 74/255, 74/255
];

var triangle3_elements = [
0, 1, 2,
0, 2, 4,

4, 5, 6,
4, 6, 7,

8, 9, 10,
8, 10, 11,

12, 13, 14,
12, 14, 15,

16, 17, 18,
16, 18, 19,

20, 21, 22,
20, 22, 23
];
    var tanah = new myObject (triangle_vertex, triangle_elements,shader_vertex_source, shader_fragment_source);
    var bulanKembangKempis = new myObject(bulan.object,bulan.objectface,shader_vertex_source,shader_fragment_source);
    var pumpkin1 = new myObject(pumpkin.object,pumpkin.objectface,shader_vertex_source,shader_fragment_source);
    var pumpkinBesar1 = new myObject(pumpkinBesar.object,pumpkinBesar.objectface,shader_vertex_source,shader_fragment_source);
    var grave2 = new myObject (grave.object,grave.objectface,shader_vertex_source,shader_fragment_source);
    var pumpkin3 = new myObject(pumpkin.object,pumpkin.objectface,shader_vertex_source,shader_fragment_source);
    var graveBesar2 = new myObject (graveBesar.object,graveBesar.objectface,shader_vertex_source,shader_fragment_source);
    var grave3 = new myObject (grave.object,grave.objectface,shader_vertex_source,shader_fragment_source);
    var grave4 = new myObject (grave.object,grave.objectface,shader_vertex_source,shader_fragment_source);
    var grave5 = new myObject (grave.object,grave.objectface,shader_vertex_source,shader_fragment_source);
    var grave6 = new myObject(graveBesar.object,graveBesar.objectface,shader_vertex_source,shader_fragment_source);
    var pumpkin2 = new myObject(pumpkin.object,pumpkin.objectface,shader_vertex_source,shader_fragment_source);
    var bangunan = new myObject (triangle1_vertex, triangle1_elements,shader_vertex_source, shader_fragment_source);
    var bangunan2 = new myObject (triangle1_vertex, triangle1_elements,shader_vertex_source, shader_fragment_source);
    var bangunan3 = new myObject (triangle2_vertex, triangle2_elements,shader_vertex_source, shader_fragment_source);
    var bangunan4 = new myObject (triangle3_vertex, triangle3_elements,shader_vertex_source, shader_fragment_source);
    var bangunan5 = new myObject (triangle3_vertex, triangle3_elements,shader_vertex_source, shader_fragment_source);
    grave2.addChild(graveBesar2);
    grave2.addChild(grave3);
    grave2.addChild(grave4);
    grave2.addChild(grave5);
    grave2.addChild(grave6);
    pumpkin1.addChild(pumpkin2);
    pumpkin1.addChild(pumpkin3);
    bangunan.addChild(bangunan2);
    bangunan.addChild(bangunan3);
    bangunan.addChild(bangunan4);
    bangunan.addChild(bangunan5);

    var simpan = [];



    // ====================================== CINNAMOROLL OBJECT ==========================================
    // BAGIAN KEPALA
    //  Sphere(rad,sector,a,b,c, red,green,blue )
    var kepalaAtas = Sphere(1.6, 1, 0.6, 0.86, 1, 1, 1, 1);
    var kepalaBawah = Sphere(0.8, 2,1.2,1,2,1,1,1);
    var telingakiri = Sphere(0.7,2,1,2,0.8,1,1,1);
    var telingaKanan = Sphere(0.7,2,1,2,0.8,1,1,1);

    // BAGIAN MATA
    var mataKiri = Sphere(0.1,2,1.5,2,1,15/255,143/255,212/255);
    var mataKanan = Sphere(0.1,2,1.5,2,1,15/255,143/255,212/255);

    // BAGIAN MULUT 
    var curveMulut = [0.0, 0.15, 0.22, 0.0, 0.33, 0.1, 0.32,0.2];
    var drawMulut = generateBSpline(curveMulut, 100, 2, 0, -0.3, 0.95, 15/255,143/255,212/255);
    var faces1 =[];
    for (let index = 0; index < drawMulut.length/6; index++) {
        faces1.push(index);
    }
    
    curveMulut = [0.0, 0.15, -0.22, 0.0, -0.33, 0.1,-0.32,0.2];
    var drawMulut1 = generateBSpline(curveMulut, 100, 2, 0, -0.3, 0.95, 15/255,143/255,212/255);
    var faces2 =[];
    for (let index = 0; index < drawMulut1.length/6; index++) {
        faces2.push(index);
    }



    // BAGIAN BADAN
    var badan = Sphere(0.8,2,1,1,1.25,1,1,1);

    // BAGIAN TANGAN
    var tangan = Sphere(0.3,2,1.5,1,0.6,1,1,1);
    // BAGIAN TOPI
    var topi = kerucut(1,2, 105/255, 7/2552, 181/255,105/255, 7/2552, 181/255);
    var alasTopi = Torus(0.15,1.5,4,1,105/255, 7/2552, 181/255);
    var pita = Torus(0.1,0.8,3,2,0,0,0);

    // BAGIAN KAKI
    var kaki = Sphere(0.3,2,1,1,0.6,1,1,1);

    // BAGIAN SAPU 
    var tongkat = tabung(0.15,0.15,3,112/255, 70/255, 23/255);
    var sapu = kerucut(0.4,0.5, 217/255, 202/255, 34/255, 217/255, 202/255, 34/255);
    var sapuBawah = Sphere(0.3,2,1.5,1,1,217/255, 202/255, 34/255);

    // BAGIAN EKOR
    var ekor = Sphere(0.5,2,1,1,1.25,1,1,1);
    var curveEkor = [0.0, 0.0, 0.05, 0.05, 0.0, 0.1, -0.15,0.15, -0.2,0.05, -0.1, -0.05, -0.1,-0.1, 0.1, -0.08, 0.2, -0.05, 0.3, 0.05, 0.2, 0.2, 0.15, 0.25, 0.0,0.3, -0.1, 0.3, -0.2, 0.25, -0.3, 0.15, -0.3, 0.1 , -0.25, -0.1];
    var drawEkor = generateBSpline(curveEkor, 100, 2, 0, -1.3, -1.5, 141/255, 177/255, 189/255);
    var faces3 =[];
    for (let index = 0; index < drawEkor.length/6; index++) {
        faces3.push(index);
    }


    var object1a = new myObject(kepalaBawah.object,kepalaBawah.objectface,shader_vertex_source,shader_fragment_source);
    var object2a = new myObject(kepalaAtas.object,kepalaAtas.objectface,shader_vertex_source,shader_fragment_source);
    var object3a = new myObject(mataKiri.object,mataKiri.objectface,shader_vertex_source,shader_fragment_source);
    var object4a= new myObject(mataKanan.object,mataKanan.objectface,shader_vertex_source,shader_fragment_source);
    var object5a = new myObject(badan.object,badan.objectface,shader_vertex_source,shader_fragment_source);

    // topi
    var object6a = new myObject(topi.circle_vertex,topi.circle_faces,shader_vertex_source,shader_fragment_source);
    var object17a = new myObject(alasTopi.object,alasTopi.objectface,shader_vertex_source,shader_fragment_source);
    var object18a = new myObject(pita.object,pita.objectface,shader_vertex_source,shader_fragment_source);

    var object7a= new myObject(ekor.object,ekor.objectface,shader_vertex_source,shader_fragment_source);
    var object8a = new myObject(telingakiri.object,telingakiri.objectface,shader_vertex_source,shader_fragment_source);
    var object9a = new myObject(tangan.object,tangan.objectface,shader_vertex_source,shader_fragment_source);
    var object10a = new myObject(telingaKanan.object,telingaKanan.objectface,shader_vertex_source,shader_fragment_source);
    var object11a = new myObject(tangan.object,tangan.objectface,shader_vertex_source,shader_fragment_source);
    var object12a = new myObject(kaki.object,kaki.objectface,shader_vertex_source,shader_fragment_source);
    var object13a = new myObject(kaki.object,kaki.objectface,shader_vertex_source,shader_fragment_source);

    // tongkat dan sapu 
    var object14a = new myObject(tongkat.circle_vertex,tongkat.circle_faces,shader_vertex_source,shader_fragment_source);
    var object15a = new myObject(sapu.circle_vertex,sapu.circle_faces,shader_vertex_source,shader_fragment_source);
    var object16a = new myObject(sapuBawah.object,sapuBawah.objectface,shader_vertex_source,shader_fragment_source);
    var object19a = new myObject(drawMulut,faces1,shader_vertex_source,shader_fragment_source);
    var object20a = new myObject(drawMulut1,faces2,shader_vertex_source,shader_fragment_source);
    var object21a = new myObject(drawEkor,faces3,shader_vertex_source,shader_fragment_source);
    var mulutSemua = [];
    mulutSemua.push(object19a,object20a,object21a);
    

    object1a.addChild(object2a); // 0
    object1a.addChild(object3a); // 1
    object1a.addChild(object4a); // 2
    object1a.addChild(object5a); // 3
    object1a.addChild(object7a); // 4
    object1a.addChild(object8a); // 5
    object1a.addChild(object9a); // 6
    object1a.addChild(object10a); // 7
    object1a.addChild(object11a); // 8
    object1a.addChild(object12a); // 9
    object1a.addChild(object13a); // 10
    object1a.addChild(object6a); // 11
    object1a.addChild(object14a); // 12
    object1a.addChild(object15a); // 13
    object1a.addChild(object16a); // 14
    object1a.addChild(object17a); // 15
    object1a.addChild(object18a); // 16
    object1a.addChild(object19a); // 17
    object1a.addChild(object20a); // 18
    object1a.addChild(object21a); // 19
    
    // ================================================ POCHACOO OBJECT========================================
    // BAGIAN KEPALA
    //  Sphere(rad,sector,a,b,c, red,green,blue )
    var kepala_atas = Sphere(1.3, 1, 0.7, 1.25, 1.1, 1, 1, 1);
    var kepala_bawah = Sphere(0.5, 2, 1.97, 1.3, 3.1, 1, 1, 1);

    // BAGIAN MATA
    var mata_kiri = Sphere(0.1, 2, 1.2, 2, 1.2, 0, 0, 0);
    var mata_kanan = Sphere(0.1, 2, 1.2, 2, 1.2, 0, 0, 0);

    // BAGIAN HIDUNG
    var hidung = Sphere(0.1, 2, 1.2, 1.3, 2, 0, 0, 0);

    // BAGIAN BADAN
    var badan_atas = Sphere(1.3, 1, 1, 1, 1.05, 1, 0, 0);
    var badan_bawah = Sphere(1.3, 2, 1, 0.45, 1.05, 1, 1, 1);

    // BAGIAN TELINGA
    var telinga_kiri_atas = kerucut(0.25, 0.7, 0, 0, 0, 0, 0, 0);
    var telinga_kiri_bawah = Sphere(0.25, 1, 1, 5, 1, 0, 0, 0);

    var telinga_kanan_atas = kerucut(0.25, 0.7, 0, 0, 0, 0, 0, 0);
    var telinga_kanan_bawah = Sphere(0.25, 1, 1, 5, 1, 0, 0, 0);

    // BAGIAN LENGAN
    var lengan_kiri = tabung(0.35, 0.45, 0.8, 1, 0, 0);
    var lengan_kanan = tabung(0.35, 0.45, 0.8, 1, 0, 0);

    // BAGIAN TANGAN
    var tangan_kiri = Sphere(0.35, 1, 1, 1.65, 1, 1, 1, 1);
    var tangan_kanan = Sphere(0.35, 1, 1, 1.65, 1, 1, 1, 1);

    // BAGIAN COLLAR
    var collar = Torus(0.6, 0.77, 0.15, 0.15, 121/255, 68/255, 59/255);
    var liontin = Sphere(0.17, 2, 1, 1, 1, 1, 215/255, 0);

    // BAGIAN TANDUK
    var tanduk_kiri = kerucut(0.25, 0.63, 187/255, 241/255, 241/255, 187/255, 241/255, 241/255);
    var tanduk_kanan = kerucut(0.25, 0.63, 187/255, 241/255, 241/255, 187/255, 241/255, 241/255);

    // BAGIAN KAKI
    var kaki_kiri = tabung(0.55, 0.7, 0.9, 1, 1, 1);
    var kaki_kanan = tabung(0.55, 0.7, 0.9, 1, 1, 1);

    // BAGIAN EKOR
    var ekor_base = Sphere(0.33, 1, 1, 1, 1, 1, 1, 1);
    var ekor_ujung = kerucut(0.33, 0.465, 1, 1, 1, 0, 0, 0);

    // BAGIAN LUKA
    var curve = [0.15, 0.1, 0.35, 0.25, 0.45, 0.4];
    var vertex = generateBSpline(curve, 100, 2, 0.43, -0.42, 0.845, 0, 0, 0);
    var faces = [];
    for (var i = 0; i < vertex.length/6; i++) {
        faces.push(i);
    }
    var scar1 = new myObject(vertex, faces, shader_vertex_source, shader_fragment_source);

    curve = [0.05, 0.25, 0.2, 0.2, 0.25, 0.1];
    var vertex = generateBSpline(curve, 100, 2, 0.41, -0.415, 0.845, 0, 0, 0);
    faces = [];
    for (var i = 0; i < vertex.length/6; i++) {
        faces.push(i);
    }
    var scar2 = new myObject(vertex, faces, shader_vertex_source, shader_fragment_source);

    vertex = generateBSpline(curve, 100, 2, 0.525, -0.33, 0.853, 0, 0, 0);
    var scar3 = new myObject(vertex, faces, shader_vertex_source, shader_fragment_source);

    vertex = generateBSpline(curve, 100, 2, 0.61, -0.23, 0.838, 0, 0, 0);
    var scar4 = new myObject(vertex, faces, shader_vertex_source, shader_fragment_source);

    var object1b = new myObject(kepala_atas.object,kepala_atas.objectface,shader_vertex_source,shader_fragment_source);
    var object2b = new myObject(kepala_bawah.object,kepala_bawah.objectface,shader_vertex_source,shader_fragment_source);
    var object3b = new myObject(mata_kiri.object,mata_kiri.objectface,shader_vertex_source,shader_fragment_source);
    var object4b = new myObject(mata_kanan.object,mata_kanan.objectface,shader_vertex_source,shader_fragment_source);
    var object5b = new myObject(hidung.object, hidung.objectface, shader_vertex_source, shader_fragment_source);
    var object6b = new myObject(badan_atas.object, badan_atas.objectface, shader_vertex_source, shader_fragment_source);
    var object7b = new myObject(badan_bawah.object, badan_bawah.objectface, shader_vertex_source, shader_fragment_source);
    var object8b = new myObject(collar.object, collar.objectface, shader_vertex_source, shader_fragment_source);
    var object9b = new myObject(liontin.object, liontin.objectface, shader_vertex_source, shader_fragment_source);
    var object10b = new myObject(tanduk_kiri.circle_vertex, tanduk_kiri.circle_faces, shader_vertex_source, shader_fragment_source);
    var object11b = new myObject(tanduk_kanan.circle_vertex, tanduk_kanan.circle_faces, shader_vertex_source, shader_fragment_source);
    var object12b = new myObject(telinga_kiri_atas.circle_vertex, telinga_kiri_atas.circle_faces, shader_vertex_source, shader_fragment_source);
    var object13b = new myObject(telinga_kiri_bawah.object, telinga_kiri_bawah.objectface, shader_vertex_source, shader_fragment_source);
    var object14b = new myObject(telinga_kanan_atas.circle_vertex, telinga_kanan_atas.circle_faces, shader_vertex_source, shader_fragment_source);
    var object15b = new myObject(telinga_kanan_bawah.object, telinga_kanan_bawah.objectface, shader_vertex_source, shader_fragment_source);
    var object16b = new myObject(lengan_kiri.circle_vertex, lengan_kiri.circle_faces, shader_vertex_source, shader_fragment_source);
    var object17b = new myObject(tangan_kiri.object, tangan_kiri.objectface, shader_vertex_source, shader_fragment_source);
    var object18b = new myObject(lengan_kanan.circle_vertex, lengan_kanan.circle_faces, shader_vertex_source, shader_fragment_source);
    var object19b = new myObject(tangan_kanan.object, tangan_kanan.objectface, shader_vertex_source, shader_fragment_source);
    var object20b = new myObject(kaki_kiri.circle_vertex, kaki_kiri.circle_faces, shader_vertex_source, shader_fragment_source);
    var object21b = new myObject(kaki_kanan.circle_vertex, kaki_kanan.circle_faces, shader_vertex_source, shader_fragment_source);
    var object22b = new myObject(ekor_base.object, ekor_base.objectface, shader_vertex_source, shader_fragment_source);
    var object23b = new myObject(ekor_ujung.circle_vertex, ekor_ujung.circle_faces, shader_vertex_source, shader_fragment_source);
    
    var scar = [];
    scar.push(scar1, scar2, scar3, scar4);

    object12b.addChild(object13b);
    object14b.addChild(object15b);

    object1b.addChild(object2b);
    object1b.addChild(object3b);
    object1b.addChild(object4b);
    object1b.addChild(object5b);
    object1b.addChild(object6b);
    object1b.addChild(object7b);
    object1b.addChild(object8b);
    object1b.addChild(object9b);
    object1b.addChild(object10b);
    object1b.addChild(object11b);
    object1b.addChild(object12b);
    object1b.addChild(object13b);
    object1b.addChild(object14b);
    object1b.addChild(object15b);
    object1b.addChild(object16b);
    object1b.addChild(object17b);
    object1b.addChild(object18b);
    object1b.addChild(object19b);
    object1b.addChild(object20b);
    object1b.addChild(object21b);
    object1b.addChild(object22b);
    object1b.addChild(object23b);
    object1b.addChild(scar1);
    object1b.addChild(scar2);
    object1b.addChild(scar3);
    object1b.addChild(scar4);

    // ======================================= KERROPI OBJECT =======================================



    //MATRIX
    var PROJMATRIX = LIBS.get_projection(110, CANVAS.width/CANVAS.height,1, 100);

    var VIEWMATRIX = LIBS.get_I4();

    LIBS.translateZ(VIEWMATRIX, -10); //untuk mundurin camera dan camera tidak menabrak dengan objeknya

    GL.clearColor(0.0, 0.0, 0.0, 0.0); //R, G, B, Opacity

    //depth test berfungsi agar objek dapat dilihat secara menjorok karena apabila tidak menggunakan depth test objeknya dapat terlihat bolong atau transparan
    GL.enable(GL.DEPTH_TEST);
    GL.depthFunc(GL.LEQUAL);

    GL.clearDepth(1.0);

    //DRAWING ---------------------------------------------------------------------------------------------
    var time_prev = 0;
    let y = 0;
    let langkah = 0.03; // Kecepatan perubahan y
    let naik = true; // Menentukan apakah objek sedang naik atau turun

    //POCHACCO ANIMATION
    var x = 0;
    var trans = 0;
    var gerak_naik = true;
    var pindah = false;

    var animate = function(time) {
        if(time > 0) {
            //delta time adalah waktu yang dibutuhkan untuk pindah 1 frame ke frame lain
            var dt = (time - time_prev);
            // LIBS.rotateX(MOVEMATRIX, dt * 0.003);
            // LIBS.rotateY(MOVEMATRIX, dt * 0.002);
            // LIBS.rotateZ(MOVEMATRIX, dt * 0.001);
            // ketika mouse dilepas tp melambat jd gerak dikit
            if(!drag){
                dX *= AMORIZATION;
                dY *= AMORIZATION;
                THETA+= dX;
                PHI+=dY;

            }

            // ============================= ENVIRONMENT============================================
            tanah.MOVEMATRIX = glMatrix.mat4.create();
            bulanKembangKempis.MOVEMATRIX = glMatrix.mat4.create();
            pumpkin1.MOVEMATRIX = glMatrix.mat4.create();
            pumpkin1.child[0].MOVEMATRIX = glMatrix.mat4.create();
            pumpkin1.child[1].MOVEMATRIX = glMatrix.mat4.create();
            pumpkinBesar1.MOVEMATRIX = glMatrix.mat4.create();
            grave2.MOVEMATRIX = glMatrix.mat4.create();
            grave2.child[0].MOVEMATRIX = glMatrix.mat4.create();
            grave2.child[1].MOVEMATRIX = glMatrix.mat4.create();
            grave2.child[2].MOVEMATRIX = glMatrix.mat4.create();
            grave2.child[3].MOVEMATRIX = glMatrix.mat4.create();
            grave2.child[4].MOVEMATRIX = glMatrix.mat4.create();
            bangunan.MOVEMATRIX = glMatrix.mat4.create();
            bangunan.child[0].MOVEMATRIX = glMatrix.mat4.create();
            bangunan.child[1].MOVEMATRIX = glMatrix.mat4.create();
            bangunan.child[2].MOVEMATRIX = glMatrix.mat4.create();
            bangunan.child[3].MOVEMATRIX = glMatrix.mat4.create();
            

           // tanah.rotateAll(THETA,PHI,0);
            bulanKembangKempis.origin(-4.0,1.0,0.0);

             if (naik) {
                y *= 0.09; // kalau naik bertambah terus pergerakannya
                 if (bulanKembangKempis.scale[0] >= 2 && bulanKembangKempis.scale[1] >= 2 && bulanKembangKempis.scale[2] >= 2   ) { // Batas atas
                     naik = false; // Ubah arah pergerakan menjadi turun
                 }
             }
             //Pergerakan turun
             else {
                 y /= -0.09; // kalau udh sampai atas bakal turun pergerakannya
                 if (bulanKembangKempis.scale[0] <=0 && bulanKembangKempis.scale[1] >= 2 && bulanKembangKempis.scale[2] >= 2  ) { // Batas bawah
                     naik = true; // Ubah arah pergerakan menjadi naik
                 }
             }
         
             // // Selalu update perubahan posisi objek pakai translateAll
            bulanKembangKempis.scalingAll(y);

            glMatrix.mat4.translate(tanah.MOVEMATRIX,tanah.MOVEMATRIX, [0.0,-6.0,-7.0]);
            glMatrix.mat4.translate(pumpkin1.MOVEMATRIX,pumpkin1.MOVEMATRIX, [-4.0,-2.0,0.0]);
            glMatrix.mat4.translate(pumpkin1.child[0].MOVEMATRIX,pumpkin1.child[0].MOVEMATRIX, [-5.0,-2.0,2.0]);
            glMatrix.mat4.translate(pumpkin1.child[1].MOVEMATRIX,pumpkin1.child[1].MOVEMATRIX, [3.0,-2.0,2.0]);
            glMatrix.mat4.translate(bulanKembangKempis.MOVEMATRIX,bulanKembangKempis.MOVEMATRIX, [-5.0,13.0,0.0]);
            glMatrix.mat4.translate(pumpkinBesar1.MOVEMATRIX,pumpkinBesar1.MOVEMATRIX, [-8.0,-2.0,-1.0]);
            glMatrix.mat4.translate(grave2.MOVEMATRIX,grave2.MOVEMATRIX, [8.0,-2.5,-1.0]);
            glMatrix.mat4.translate(grave2.child[0].MOVEMATRIX,grave2.child[0].MOVEMATRIX, [10.0,-2.0,1.0]);
            glMatrix.mat4.translate(grave2.child[1].MOVEMATRIX,grave2.child[1].MOVEMATRIX, [15.0,-2.5,1.0]);
            glMatrix.mat4.translate(grave2.child[2].MOVEMATRIX,grave2.child[2].MOVEMATRIX, [-10.0,-2.5,1.0]);
            glMatrix.mat4.translate(grave2.child[3].MOVEMATRIX,grave2.child[3].MOVEMATRIX, [-12.0,-2.5,5.0]);
            glMatrix.mat4.translate(grave2.child[4].MOVEMATRIX,grave2.child[4].MOVEMATRIX, [-15.0,-2.0,0.0]);
            glMatrix.mat4.translate(bangunan.MOVEMATRIX,bangunan.MOVEMATRIX, [6.0,2.0,-6.0]);
            glMatrix.mat4.translate(bangunan.child[0].MOVEMATRIX,bangunan.child[0].MOVEMATRIX, [-6.0,2.0,-6.0]);
            glMatrix.mat4.translate(bangunan.child[1].MOVEMATRIX,bangunan.child[1].MOVEMATRIX, [0.0,7.0,-6.0]);
            glMatrix.mat4.translate(bangunan.child[2].MOVEMATRIX,bangunan.child[2].MOVEMATRIX, [-6.0,-2.0,-6.0]);
            glMatrix.mat4.translate(bangunan.child[3].MOVEMATRIX,bangunan.child[3].MOVEMATRIX, [6.0,-2.0,-6.0]);



            // ================================================ CINNAMOROLL ================================
            //  object cinnamoroll create set identity  (0,0,0) --> jd balek ke 0
            object1a.MOVEMATRIX = glMatrix.mat4.create(); 
            object1a.child[0].MOVEMATRIX = glMatrix.mat4.create();
            object1a.child[1].MOVEMATRIX = glMatrix.mat4.create();
            object1a.child[2].MOVEMATRIX = glMatrix.mat4.create();
            object1a.child[3].MOVEMATRIX = glMatrix.mat4.create();
            object1a.child[4].MOVEMATRIX = glMatrix.mat4.create();
            object1a.child[5].MOVEMATRIX = glMatrix.mat4.create();
            object1a.child[6].MOVEMATRIX = glMatrix.mat4.create();
            object1a.child[7].MOVEMATRIX = glMatrix.mat4.create();
            object1a.child[8].MOVEMATRIX = glMatrix.mat4.create();
            object1a.child[9].MOVEMATRIX = glMatrix.mat4.create();
            object1a.child[10].MOVEMATRIX = glMatrix.mat4.create();
            object1a.child[11].MOVEMATRIX = glMatrix.mat4.create();
            object1a.child[12].MOVEMATRIX = glMatrix.mat4.create();
            object1a.child[13].MOVEMATRIX = glMatrix.mat4.create();
            object1a.child[14].MOVEMATRIX = glMatrix.mat4.create();
            object1a.child[15].MOVEMATRIX = glMatrix.mat4.create();
            object1a.child[16].MOVEMATRIX = glMatrix.mat4.create();
            object1a.child[17].MOVEMATRIX = glMatrix.mat4.create();
            object1a.child[18].MOVEMATRIX = glMatrix.mat4.create();
            object1a.child[19].MOVEMATRIX = glMatrix.mat4.create();


            object1a.origin(0,1,0);
            
            // object1.translateAll([2,0,0]);
            //object1a.rotateAll(LIBS.degToRad(-10),LIBS.degToRad(20),0);

           if (naik) {
               y = 0.03; // langkah; // kalau naik bertambah terus pergerakannya
                if (object1a.translasi[1] >= 3 ) { // Batas atas
                    naik = false; // Ubah arah pergerakan menjadi turun
                }
            }
            //Pergerakan turun
            else {
                y = -0.03; // kalau udh sampai atas bakal turun pergerakannya
                if (object1a.translasi[1] <= 1) { // Batas bawah
                    naik = true; // Ubah arah pergerakan menjadi naik
                }
            }
        
            // // Selalu update perubahan posisi objek pakai translateAll
            //object1a.rotateAll(LIBS.degToRad(60),0,0);

             object1a.translateAll(0,y,0);
            


             
            

            // glMatrix.mat4.rotateX(tanah.MOVEMATRIX, tanah.MOVEMATRIX, LIBS.degToRad(90));

            // tanah di translasli

            // buat kepala bawah
            glMatrix.mat4.translate(object1a.MOVEMATRIX,object1a.MOVEMATRIX, [7.0,0.0,0.0]);
           
            // buat kepala atas
            glMatrix.mat4.translate(object1a.child[0].MOVEMATRIX,object1a.child[0].MOVEMATRIX, [7.0,0.0,0.0]);
            // buat mata kiri
            glMatrix.mat4.translate(object1a.child[1].MOVEMATRIX,object1a.child[1].MOVEMATRIX, [5.8,0.1,0.85]);
            // buat mata kanan
            glMatrix.mat4.translate(object1a.child[2].MOVEMATRIX,object1a.child[2].MOVEMATRIX, [7.0,0.1,0.95]);
            // buat badan
            glMatrix.mat4.translate(object1a.child[3].MOVEMATRIX,object1a.child[3].MOVEMATRIX, [7.0,-1.0,0.0]);

            // buat tangan kiri
            glMatrix.mat4.translate(object1a.child[6].MOVEMATRIX,object1a.child[6].MOVEMATRIX, [5.7,-0.6,0.5]);
            glMatrix.mat4.rotateZ(object1a.child[6].MOVEMATRIX, object1a.child[6].MOVEMATRIX, LIBS.degToRad(95));

            // buat tangan kanan
            glMatrix.mat4.translate(object1a.child[8].MOVEMATRIX,object1a.child[8].MOVEMATRIX, [7.8,-0.6,0.7]);
            glMatrix.mat4.rotateZ(object1a.child[8].MOVEMATRIX, object1a.child[8].MOVEMATRIX, LIBS.degToRad(-65));

            // buat ekor
            glMatrix.mat4.translate(object1a.child[4].MOVEMATRIX,object1a.child[4].MOVEMATRIX, [7.0,-1.2,-1.0]);
            // buat telinga kiri
            glMatrix.mat4.translate(object1a.child[5].MOVEMATRIX,object1a.child[5].MOVEMATRIX, [5.0,0.3,0.0]);
            glMatrix.mat4.rotateZ(object1a.child[5].MOVEMATRIX, object1a.child[5].MOVEMATRIX, LIBS.degToRad(-65));
            // telinga kanan 
            glMatrix.mat4.translate(object1a.child[7].MOVEMATRIX,object1a.child[7].MOVEMATRIX, [8.7,0.3,0.0]);
            glMatrix.mat4.rotateZ(object1a.child[7].MOVEMATRIX, object1a.child[7].MOVEMATRIX, LIBS.degToRad(65));

            // buat kaki kiri
            glMatrix.mat4.translate(object1a.child[9].MOVEMATRIX,object1a.child[9].MOVEMATRIX, [5.9,-1.4,0.5]);
            glMatrix.mat4.rotateZ(object1a.child[9].MOVEMATRIX, object1a.child[9].MOVEMATRIX, LIBS.degToRad(75));

            // buat kaki kanan
            glMatrix.mat4.translate(object1a.child[10].MOVEMATRIX,object1a.child[10].MOVEMATRIX, [7.7,-1.4,0.5]);
            glMatrix.mat4.rotateZ(object1a.child[10].MOVEMATRIX, object1a.child[10].MOVEMATRIX, LIBS.degToRad(-75));

            // buat topi
            glMatrix.mat4.translate(object1a.child[11].MOVEMATRIX,object1a.child[11].MOVEMATRIX, [7.0,1.2,0.0]);
            glMatrix.mat4.rotateX(object1a.child[11].MOVEMATRIX, object1a.child[11].MOVEMATRIX, LIBS.degToRad(-90));
            glMatrix.mat4.translate(object1a.child[15].MOVEMATRIX,object1a.child[15].MOVEMATRIX, [7.0,0.98,0.0]);
            glMatrix.mat4.rotateX(object1a.child[15].MOVEMATRIX, object1a.child[15].MOVEMATRIX, LIBS.degToRad(-90));
            glMatrix.mat4.translate(object1a.child[16].MOVEMATRIX,object1a.child[16].MOVEMATRIX, [7.0,1.15,0.0]);
            glMatrix.mat4.rotateX(object1a.child[16].MOVEMATRIX, object1a.child[16].MOVEMATRIX, LIBS.degToRad(-90));

            // buat tongkat
            glMatrix.mat4.translate(object1a.child[12].MOVEMATRIX,object1a.child[12].MOVEMATRIX, [6.9,-2.4,0.3]);
            glMatrix.mat4.rotateX(object1a.child[12].MOVEMATRIX, object1a.child[12].MOVEMATRIX, LIBS.degToRad(-70));
            glMatrix.mat4.rotateY(object1a.child[12].MOVEMATRIX, object1a.child[12].MOVEMATRIX, LIBS.degToRad(-45));
            
            // buat sapu 
            glMatrix.mat4.translate(object1a.child[13].MOVEMATRIX,object1a.child[13].MOVEMATRIX, [6.9,-2.4,0.3]);
            glMatrix.mat4.rotateX(object1a.child[13].MOVEMATRIX, object1a.child[13].MOVEMATRIX, LIBS.degToRad(100));
            glMatrix.mat4.rotateY(object1a.child[13].MOVEMATRIX, object1a.child[13].MOVEMATRIX, LIBS.degToRad(45));
            
            // buat sapu bawah 
            glMatrix.mat4.translate(object1a.child[14].MOVEMATRIX,object1a.child[14].MOVEMATRIX, [7.45,-2.9,0.2]);
            glMatrix.mat4.rotateX(object1a.child[14].MOVEMATRIX, object1a.child[14].MOVEMATRIX, LIBS.degToRad(100));
            glMatrix.mat4.rotateY(object1a.child[14].MOVEMATRIX, object1a.child[14].MOVEMATRIX, LIBS.degToRad(45));

            // buat mulut
            glMatrix.mat4.translate(object1a.child[17].MOVEMATRIX,object1a.child[17].MOVEMATRIX, [6.45,0.0,0.0]);
            glMatrix.mat4.translate(object1a.child[18].MOVEMATRIX,object1a.child[18].MOVEMATRIX, [6.45,0.0,0.0]);
            glMatrix.mat4.translate(object1a.child[19].MOVEMATRIX,object1a.child[19].MOVEMATRIX, [7.0,0.0,0.0]);
            

            // =========================================== POCHACO ===================================
            //Draw
            object1b.MOVEMATRIX = glMatrix.mat4.create();
            object1b.child[0].MOVEMATRIX = glMatrix.mat4.create();
            object1b.child[1].MOVEMATRIX = glMatrix.mat4.create();
            object1b.child[2].MOVEMATRIX = glMatrix.mat4.create();
            object1b.child[3].MOVEMATRIX = glMatrix.mat4.create();
            object1b.child[4].MOVEMATRIX = glMatrix.mat4.create();
            object1b.child[5].MOVEMATRIX = glMatrix.mat4.create();
            object1b.child[6].MOVEMATRIX = glMatrix.mat4.create();
            object1b.child[7].MOVEMATRIX = glMatrix.mat4.create();
            object1b.child[8].MOVEMATRIX = glMatrix.mat4.create();
            object1b.child[9].MOVEMATRIX = glMatrix.mat4.create();
            object1b.child[10].MOVEMATRIX = glMatrix.mat4.create();
            object1b.child[11].MOVEMATRIX = glMatrix.mat4.create();
            object1b.child[12].MOVEMATRIX = glMatrix.mat4.create();
            object1b.child[13].MOVEMATRIX = glMatrix.mat4.create();
            object1b.child[14].MOVEMATRIX = glMatrix.mat4.create();
            object1b.child[15].MOVEMATRIX = glMatrix.mat4.create();
            object1b.child[16].MOVEMATRIX = glMatrix.mat4.create();
            object1b.child[17].MOVEMATRIX = glMatrix.mat4.create();
            object1b.child[18].MOVEMATRIX = glMatrix.mat4.create();
            object1b.child[19].MOVEMATRIX = glMatrix.mat4.create();
            object1b.child[20].MOVEMATRIX = glMatrix.mat4.create();
            object1b.child[21].MOVEMATRIX = glMatrix.mat4.create();
            object1b.child[22].MOVEMATRIX = glMatrix.mat4.create();
            object1b.child[23].MOVEMATRIX = glMatrix.mat4.create();
            object1b.child[24].MOVEMATRIX = glMatrix.mat4.create();
            object1b.child[25].MOVEMATRIX = glMatrix.mat4.create();

            
            if (gerak_naik) {
                x = -0.15;
                trans = -0.001;
                if(object12b.rotasi[2] <= -23 && object14b.rotasi[2] >= 23) {
                    gerak_naik = false;
                }
            }  
            else {
                x = 0.15;
                trans = 0.001;
                if(object12b.rotasi[2] >= 0 && object14b.rotasi[2] <= 0) {
                    gerak_naik = true;
                }
            }

            object12b.rotateAll(0, 0, x);
            object12b.translateAll(trans, 0, 0);
            object12b.origin(0, 0, 0);
            object14b.rotateAll(0, 0, -x);
            object14b.translateAll(-trans, 0, 0);
            object14b.origin(0, 0, 0);
            

            //kepala atas
            glMatrix.mat4.translate(object1b.MOVEMATRIX,object1b.MOVEMATRIX, [0.0, 0.2, 0.0]);
            
            //kepala bawah
            glMatrix.mat4.translate(object1b.child[0].MOVEMATRIX,object1b.child[0].MOVEMATRIX, [0.0, -0.03, 0.0]);
            
            //mata kiri
            glMatrix.mat4.translate(object1b.child[1].MOVEMATRIX,object1b.child[1].MOVEMATRIX, [-0.6, 0.2, 0.9]);
           
            //mata kanan
            glMatrix.mat4.translate(object1b.child[2].MOVEMATRIX,object1b.child[2].MOVEMATRIX, [0.6, 0.2, 0.9]);

            //hidung
            glMatrix.mat4.translate(object1b.child[3].MOVEMATRIX,object1b.child[3].MOVEMATRIX, [0.0, 0.0, 1]);

            //badan atas
            glMatrix.mat4.translate(object1b.child[4].MOVEMATRIX, object1b.child[4].MOVEMATRIX, [0.0, -1.82, 0.0]);

            //badan bawah
            glMatrix.mat4.translate(object1b.child[5].MOVEMATRIX,object1b.child[5].MOVEMATRIX, [0.0, -1.91, 0.0]);

            //collar
            glMatrix.mat4.translate(object1b.child[6].MOVEMATRIX,object1b.child[6].MOVEMATRIX, [0.0, -0.65, 0.0]);
            glMatrix.mat4.rotateX(object1b.child[6].MOVEMATRIX, object1b.child[6].MOVEMATRIX, LIBS.degToRad(90));

            //liontin
            glMatrix.mat4.translate(object1b.child[7].MOVEMATRIX,object1b.child[7].MOVEMATRIX, [0.0, -0.64, 0.8]);

            //tanduk kiri
            glMatrix.mat4.translate(object1b.child[8].MOVEMATRIX,object1b.child[8].MOVEMATRIX, [-0.6, 1.2, 0.47]);
            glMatrix.mat4.rotateX(object1b.child[8].MOVEMATRIX, object1b.child[8].MOVEMATRIX, LIBS.degToRad(-55));
            glMatrix.mat4.rotateY(object1b.child[8].MOVEMATRIX, object1b.child[8].MOVEMATRIX, LIBS.degToRad(-20));

            //tanduk kanan
            glMatrix.mat4.translate(object1b.child[9].MOVEMATRIX,object1b.child[9].MOVEMATRIX, [0.6, 1.2, 0.47]);
            glMatrix.mat4.rotateX(object1b.child[9].MOVEMATRIX, object1b.child[9].MOVEMATRIX, LIBS.degToRad(-55));
            glMatrix.mat4.rotateY(object1b.child[9].MOVEMATRIX, object1b.child[9].MOVEMATRIX, LIBS.degToRad(20));

            //telinga kiri atas
            glMatrix.mat4.translate(object1b.child[10].MOVEMATRIX,object1b.child[10].MOVEMATRIX, [-1.23, 0.865, 0.0]);
            glMatrix.mat4.rotateX(object1b.child[10].MOVEMATRIX, object1b.child[10].MOVEMATRIX, LIBS.degToRad(-90));
            glMatrix.mat4.rotateY(object1b.child[10].MOVEMATRIX, object1b.child[10].MOVEMATRIX, LIBS.degToRad(29));

            //telinga kiri bawah
            glMatrix.mat4.translate(object1b.child[11].MOVEMATRIX,object1b.child[11].MOVEMATRIX, [-1.225, 0.865, 0.0]);
            glMatrix.mat4.rotateY(object1b.child[11].MOVEMATRIX, object1b.child[11].MOVEMATRIX, LIBS.degToRad(90));
            glMatrix.mat4.rotateX(object1b.child[11].MOVEMATRIX, object1b.child[11].MOVEMATRIX, LIBS.degToRad(-151));
            
            //telinga kanan atas
            glMatrix.mat4.translate(object1b.child[12].MOVEMATRIX,object1b.child[12].MOVEMATRIX, [1.23, 0.865, 0.0]);
            glMatrix.mat4.rotateX(object1b.child[12].MOVEMATRIX, object1b.child[12].MOVEMATRIX, LIBS.degToRad(-90));
            glMatrix.mat4.rotateY(object1b.child[12].MOVEMATRIX, object1b.child[12].MOVEMATRIX, LIBS.degToRad(-29));

            //telinga kanan bawah
            glMatrix.mat4.translate(object1b.child[13].MOVEMATRIX,object1b.child[13].MOVEMATRIX, [1.225, 0.865, 0.0]);
            glMatrix.mat4.rotateY(object1b.child[13].MOVEMATRIX, object1b.child[13].MOVEMATRIX, LIBS.degToRad(90));
            glMatrix.mat4.rotateX(object1b.child[13].MOVEMATRIX, object1b.child[13].MOVEMATRIX, LIBS.degToRad(151));

            //lengan kiri
            glMatrix.mat4.translate(object1b.child[14].MOVEMATRIX,object1b.child[14].MOVEMATRIX, [-1.43, -0.7, 0.0]);
            glMatrix.mat4.rotateY(object1b.child[14].MOVEMATRIX, object1b.child[14].MOVEMATRIX, LIBS.degToRad(-90));
            glMatrix.mat4.rotateX(object1b.child[14].MOVEMATRIX, object1b.child[14].MOVEMATRIX, LIBS.degToRad(145));

            //tangan kiri
            glMatrix.mat4.translate(object1b.child[15].MOVEMATRIX,object1b.child[15].MOVEMATRIX, [-1.43, -0.69, 0.0]);
            glMatrix.mat4.rotateY(object1b.child[15].MOVEMATRIX, object1b.child[15].MOVEMATRIX, LIBS.degToRad(90));
            glMatrix.mat4.rotateX(object1b.child[15].MOVEMATRIX, object1b.child[15].MOVEMATRIX, LIBS.degToRad(-50));

            //lengan kanan
            glMatrix.mat4.translate(object1b.child[16].MOVEMATRIX,object1b.child[16].MOVEMATRIX, [1.43, -0.7, 0.0]);
            glMatrix.mat4.rotateY(object1b.child[16].MOVEMATRIX, object1b.child[16].MOVEMATRIX, LIBS.degToRad(90));
            glMatrix.mat4.rotateX(object1b.child[16].MOVEMATRIX, object1b.child[16].MOVEMATRIX, LIBS.degToRad(145));

            //tangan kanan
            glMatrix.mat4.translate(object1b.child[17].MOVEMATRIX,object1b.child[17].MOVEMATRIX, [1.43, -0.69, 0.0]);
            glMatrix.mat4.rotateY(object1b.child[17].MOVEMATRIX, object1b.child[17].MOVEMATRIX, LIBS.degToRad(-90));
            glMatrix.mat4.rotateX(object1b.child[17].MOVEMATRIX, object1b.child[17].MOVEMATRIX, LIBS.degToRad(-50));
            
            //kaki kiri
            glMatrix.mat4.translate(object1b.child[18].MOVEMATRIX,object1b.child[18].MOVEMATRIX, [-0.57, -2.8, 0.0]);
            glMatrix.mat4.rotateY(object1b.child[18].MOVEMATRIX, object1b.child[18].MOVEMATRIX, LIBS.degToRad(-90));
            glMatrix.mat4.rotateX(object1b.child[18].MOVEMATRIX, object1b.child[18].MOVEMATRIX, LIBS.degToRad(-85));

            //kaki kanan
            glMatrix.mat4.translate(object1b.child[19].MOVEMATRIX,object1b.child[19].MOVEMATRIX, [0.57, -2.8, 0.0]);
            glMatrix.mat4.rotateY(object1b.child[19].MOVEMATRIX, object1b.child[19].MOVEMATRIX, LIBS.degToRad(90));
            glMatrix.mat4.rotateX(object1b.child[19].MOVEMATRIX, object1b.child[19].MOVEMATRIX, LIBS.degToRad(-85));
           
            //ekor base
            glMatrix.mat4.translate(object1b.child[20].MOVEMATRIX,object1b.child[20].MOVEMATRIX, [0.0, -1.95, -1.55]);
            glMatrix.mat4.rotateY(object1b.child[20].MOVEMATRIX, object1b.child[20].MOVEMATRIX, LIBS.degToRad(-180));
            glMatrix.mat4.rotateX(object1b.child[20].MOVEMATRIX, object1b.child[20].MOVEMATRIX, LIBS.degToRad(-90));

            //ekor ujung
            glMatrix.mat4.translate(object1b.child[21].MOVEMATRIX,object1b.child[21].MOVEMATRIX, [0.0, -1.95, -1.55]);
            glMatrix.mat4.rotateX(object1b.child[21].MOVEMATRIX, object1b.child[21].MOVEMATRIX, LIBS.degToRad(-180));

            time_prev = time;
        }

        GL.viewport(0,0,CANVAS.width, CANVAS.height);
        GL.clear(GL.COLOR_BUFFER_BIT | GL.D_BUFFER_BIT);
        object1a.setUniform4(PROJMATRIX,VIEWMATRIX);
        object1a.draw(mulutSemua);
        object1b.setUniform4(PROJMATRIX,VIEWMATRIX);
        object1b.draw(scar);
        tanah.setUniform4(PROJMATRIX,VIEWMATRIX);
        tanah.draw(mulutSemua);
        bulanKembangKempis.setUniform4(PROJMATRIX,VIEWMATRIX);
        bulanKembangKempis.draw(mulutSemua);
        pumpkin1.setUniform4(PROJMATRIX,VIEWMATRIX);
        pumpkin1.draw(mulutSemua);
        pumpkinBesar1.setUniform4(PROJMATRIX,VIEWMATRIX);
        pumpkinBesar1.draw(mulutSemua);
        grave2.setUniform4(PROJMATRIX,VIEWMATRIX);
        grave2.draw(mulutSemua);
        bangunan.setUniform4(PROJMATRIX,VIEWMATRIX);
        bangunan.draw(mulutSemua);
        GL.flush();

        window.requestAnimationFrame(animate);

    };
    animate();



};
window.addEventListener('load', main);