// biar jd variable global
var GL;
function normalizeScreen(x, y, width, height) {
    var nx = (2 * x) / width - 1;
    var ny = (-2 * y) / height + 1;
  
    return [nx, ny];
  }
  
  function generateBSpline(controlPoint, m, degree, zValues) {
    var curves = [];
    var knotVector = [];
  
    var n = controlPoint.length / 2;
  
    // Calculate the knot values based on the degree and number of control points
    for (var i = 0; i < n + degree + 1; i++) {
      if (i < degree + 1) {
        knotVector.push(0);
      } else if (i >= n) {
        knotVector.push(n - degree);
      } else {
        knotVector.push(i - degree);
      }
    }
  
    var basisFunc = function (i, j, t) {
      if (j == 0) {
        if (knotVector[i] <= t && t < knotVector[i + 1]) {
          return 1;
        } else {
          return 0;
        }
      }
  
      var den1 = knotVector[i + j] - knotVector[i];
      var den2 = knotVector[i + j + 1] - knotVector[i + 1];
  
      var term1 = 0;
      var term2 = 0;
  
      if (den1 != 0 && !isNaN(den1)) {
        term1 = ((t - knotVector[i]) / den1) * basisFunc(i, j - 1, t);
      }
  
      if (den2 != 0 && !isNaN(den2)) {
        term2 = ((knotVector[i + j + 1] - t) / den2) * basisFunc(i + 1, j - 1, t);
      }
  
      return term1 + term2;
    };
  
    for (var t = 0; t < m; t++) {
      var x = 0;
      var y = 0;
  
      var u =
        (t / m) * (knotVector[controlPoint.length / 2] - knotVector[degree]) +
        knotVector[degree];
  
      //C(t)
      for (var key = 0; key < n; key++) {
        var C = basisFunc(key, degree, u);
        //console.log(C);
        x += controlPoint[key * 2] * C;
        y += controlPoint[key * 2 + 1] * C;
        //console.log(t + " " + degree + " " + x + " " + y + " " + C);
      }
      curves.push(x);
      curves.push(y);
      curves.push(zValues);
    }
    //console.log(curves);
    return curves;
  }
class myObject{

     object_vertex = [];
    // ini bebas yang var tp GL hrs sama
     OBJECT_VERTEX = GL.createBuffer();
     object_faces = [];
     OBJECT_FACES= GL.createBuffer();
     // kasih anak
     child =[];
   

    shader_vertex_source;
    // vColor hrs sama atas dan bawah kalau ga ga jalan, Fragcolor buat panggil warnanya
    shader_fragment_source;

    // ini template diambil aja 
     compile_shader = function(source, type, typeString){
        var shader = GL.createShader(type);
        GL.shaderSource(shader, source);
        GL.compileShader(shader);
        if(!GL.getShaderParameter(shader, GL.COMPILE_STATUS)){
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
    }

    draw(){
        GL.useProgram(this.SHADER_PROGRAM);
        GL.bindBuffer(GL.ARRAY_BUFFER,this.OBJECT_VERTEX);
        GL.vertexAttribPointer(this._position,3,GL.FLOAT,false,4*(3+3), 0);
        GL.vertexAttribPointer(this._color,3,GL.FLOAT,false,4*(3+3), 3*4);
        GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.OBJECT_FACES);
        GL.drawElements(GL.TRIANGLES,this.object_faces.length, GL.UNSIGNED_SHORT,0);

        for(var i =0;i <this.child.length;i++){
            this.child[i].draw();
        }

    }
    // buat anak pernakan
    addChild(child){
        this.child.push(child);
        // tiap kali rotate juga anaknya draw anaknya juga
    }

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

function kerucut (rad, length, red, green, blue){
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
        circle_vertex.push(red);
        circle_vertex.push(green);
        circle_vertex.push(blue);
    
    
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
    
        return{circle_faces,circle_vertex};
    };

function tabung(rad, length, red, green,blue){
    var circle_vertex = [];
var jumlah = 360;

for (var i = 0; i <= jumlah; i++) {
    circle_vertex.push(rad * Math.cos(i * Math.PI / 180));
    circle_vertex.push(rad * Math.sin(i * Math.PI / 180));
    circle_vertex.push(0);

    circle_vertex.push(red);
    circle_vertex.push(green);
    circle_vertex.push(blue);
}

// LINGKARAN BAWAH 
for (var i = 0; i <= jumlah; i++) {
    circle_vertex.push(rad * Math.cos(i * Math.PI / 180));
    circle_vertex.push(rad * Math.sin(i * Math.PI / 180));
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
console.log(circle_vertex.length);
// ALAS ATAS HUHUUHUHH
for (var i = 361 ; i <= 721 ; i++){
    circle_faces.push(i);
    circle_faces.push(i+1);
    circle_faces.push(721);
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
    var CANVAS = document.getElementById("myCanvas");

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

    // BAGIAN KEPALA
    //  Sphere(rad,sector,a,b,c, red,green,blue )
    var kepalaAtas = Sphere(0.3, 2, 1, 0.86, 1.3, 0, 1, 0);
    var kepalaBawah = Sphere(0.3, 2, 2, 1.5, 2, 0, 1, 0);

    // BAGIAN MATA
    var mataKiriAtas = Sphere(0.15, 1, 1, 1, 1, 1, 1, 1);
    var mataKiriBawah = Sphere(0.15, 2, 1, 1, 1, 1, 1, 1);
    var mataKananAtas = Sphere(0.15, 1, 1, 1, 1, 1, 1, 1);
    var mataKananBawah = Sphere(0.15, 2, 1, 1, 1, 1, 1, 1);
    var mataKananHitam = Sphere(0.05, 2, 1, 1, 1, 0, 0, 0);
    var mataKiriHitam = Sphere(0.05, 2, 1, 1, 1, 0, 0, 0);

    // BAGIAN MULUT

    

    // BAGIAN BADAN
    var badan = tabung(0.5, 0.8, 0, 1, 0);

    // BAGIAN TANGAN KIRI
    // Kerucut (rad, length, red, green, blue)
    var tanganKiriAtas = Sphere(0.15, 1, 1, 1, 1.25, 0, 1, 0);
    var tanganKiriBawah = Sphere(0.15, 2, 1, 1, 1.25, 0, 1, 0);
    var jariKiri1 = kerucut(0.05, 0.07, 0, 1, 0);
    var jariKiri2 = kerucut(0.05, 0.07, 0, 1, 0);
    var jariKiri3 = kerucut(0.05, 0.07, 0, 1, 0);
    

    //BAGIAN TANGAN KANAN
    var tanganKananAtas = Sphere(0.15, 1, 1, 1, 1.25, 0, 1, 0);
    var tanganKananBawah = Sphere(0.15, 2, 1, 1, 1.25, 0, 1, 0);
    var jariKanan1 = kerucut(0.05, 0.07, 0, 1, 0);
    var jariKanan2 = kerucut(0.05, 0.07, 0, 1, 0);
    var jariKanan3 = kerucut(0.05, 0.07, 0, 1, 0);

    //BAGIAN KAKI KANAN
    var kakiKananAtas = Sphere(0.2, 2, 1.2, 1, 1.5, 0, 1, 1);
    var kakiKananBawah = Sphere(0.2, 2, 1.2, 1, 1.5, 0, 1, 1);

    //BAGIAN KAKI KIRI
    var kakiKiriAtas = Sphere(0.2, 2, 1.2, 1, 1.5, 0, 1, 1);
    var kakiKiriBawah = Sphere(0.2, 2, 1.2, 1, 1.5, 0, 1, 1);

    

    var object1 = new myObject(kepalaAtas.object,kepalaAtas.objectface,shader_vertex_source,shader_fragment_source);
    var object2 = new myObject(kepalaBawah.object,kepalaBawah.objectface,shader_vertex_source,shader_fragment_source);

    var object3 = new myObject(mataKiriAtas.object,mataKiriAtas.objectface,shader_vertex_source,shader_fragment_source);
    var object4 = new myObject(mataKiriBawah.object,mataKiriBawah.objectface,shader_vertex_source,shader_fragment_source);

    var object5 = new myObject(mataKananAtas.object,mataKananAtas.objectface,shader_vertex_source,shader_fragment_source);
    var object6 = new myObject(mataKananBawah.object,mataKananBawah.objectface,shader_vertex_source,shader_fragment_source);

    var object7 = new myObject(jariKiri1.circle_vertex, jariKiri1.circle_faces, shader_vertex_source, shader_fragment_source);
    var object8 = new myObject(jariKiri2.circle_vertex, jariKiri2.circle_faces, shader_vertex_source, shader_fragment_source);
    var object9 = new myObject(jariKiri3.circle_vertex, jariKiri3.circle_faces, shader_vertex_source, shader_fragment_source);

    var object10 = new myObject(tanganKiriAtas.object, tanganKiriAtas.objectface, shader_vertex_source, shader_fragment_source);
    var object20 = new myObject(tanganKiriBawah.object, tanganKiriBawah.objectface, shader_vertex_source, shader_fragment_source);

    var object11 = new myObject(jariKanan1.circle_vertex, jariKanan1.circle_faces, shader_vertex_source, shader_fragment_source);
    var object12 = new myObject(jariKanan2.circle_vertex, jariKanan2.circle_faces, shader_vertex_source, shader_fragment_source);
    var object13 = new myObject(jariKanan3.circle_vertex, jariKanan3.circle_faces, shader_vertex_source, shader_fragment_source);

    var object14 = new myObject(tanganKananAtas.object, tanganKananAtas.objectface, shader_vertex_source, shader_fragment_source);
    var object21 = new myObject(tanganKananBawah.object, tanganKananBawah.objectface, shader_vertex_source, shader_fragment_source);

    var object15 = new myObject(mataKananHitam.object, mataKananHitam.objectface,shader_vertex_source,shader_fragment_source);
    var object16 = new myObject(mataKiriHitam.object, mataKiriHitam.objectface,shader_vertex_source,shader_fragment_source);

    var object17 = new myObject(badan.circle_vertex, badan.circle_faces,shader_vertex_source,shader_fragment_source);

    var object18 = new myObject(kakiKananAtas.object, kakiKananAtas.objectface, shader_vertex_source, shader_fragment_source);
    var object19 = new myObject(kakiKananBawah.object, kakiKananBawah.objectface, shader_vertex_source, shader_fragment_source);
    var object22 = new myObject(kakiKiriAtas.object, kakiKiriAtas.objectface, shader_vertex_source, shader_fragment_source);
    var object23 = new myObject(kakiKiriBawah.object, kakiKiriBawah.objectface, shader_vertex_source, shader_fragment_source);


    object1.addChild(object2); //0
    object1.addChild(object3); //1
    object1.addChild(object4); //2
    object1.addChild(object5); //3
    object1.addChild(object6); //4
    object1.addChild(object15);  //5
    object1.addChild(object16);  //6 
    object1.addChild(object17);  //7
    object1.addChild(object18);  //8
    object1.addChild(object19);  //9
    object1.addChild(object22);  //10
    object1.addChild(object23);  //11
    
    object10.addChild(object7);  //0
    object10.addChild(object8);  //1
    object10.addChild(object9);  //2
    object10.addChild(object20)  //3

    object14.addChild(object11);  //0
    object14.addChild(object12);  //1
    object14.addChild(object13);  //2
    object14.addChild(object21)  //3
    
    
    
    
    
    //MATRIX
    var PROJMATRIX = LIBS.get_projection(40, CANVAS.width/CANVAS.height,1, 100);

    var VIEWMATRIX = LIBS.get_I4();

    LIBS.translateZ(VIEWMATRIX, -7); //untuk mundurin camera dan camera tidak menabrak dengan objeknya

    GL.clearColor(0.0, 0.0, 0.0, 0.0); //R, G, B, Opacity

    //depth test berfungsi agar objek dapat dilihat secara menjorok karena apabila tidak menggunakan depth test objeknya dapat terlihat bolong atau transparan
    GL.enable(GL.DEPTH_TEST);
    GL.depthFunc(GL.LEQUAL);

    GL.clearDepth(1.0);

    //DRAWING ---------------------------------------------------------------------------------------------
    var time_prev = 0;
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
            
            // harus urut z ,y,x agar muternya benar  
            // ini buat bs muterin objectnya kyk bumi mengelilingi matahari 


            // matrix posisi , matrix rotasi 


            // ini buat posisi
            //kepala atas
            object1.MOVEMATRIX = glMatrix.mat4.create();
            glMatrix.mat4.rotateY(object1.MOVEMATRIX, object1.MOVEMATRIX, THETA);
            glMatrix.mat4.rotateX(object1.MOVEMATRIX, object1.MOVEMATRIX, PHI);
            glMatrix.mat4.translate(object1.MOVEMATRIX,object1.MOVEMATRIX, [0.0,0.0,0.0]);

            //kepala bawah
            object1.child[0].MOVEMATRIX = glMatrix.mat4.create();
            glMatrix.mat4.rotateY(object1.child[0].MOVEMATRIX, object1.child[0].MOVEMATRIX, THETA);
            glMatrix.mat4.rotateX(object1.child[0].MOVEMATRIX, object1.child[0].MOVEMATRIX, PHI);
            glMatrix.mat4.translate(object1.child[0].MOVEMATRIX, object1.child[0].MOVEMATRIX, [0.0,0.2,0.0]);

            //mata kiri atas
            object1.child[1].MOVEMATRIX = glMatrix.mat4.create();
            glMatrix.mat4.rotateY(object1.child[1].MOVEMATRIX, object1.child[1].MOVEMATRIX, THETA);
            glMatrix.mat4.rotateX(object1.child[1].MOVEMATRIX, object1.child[1].MOVEMATRIX, PHI);
            glMatrix.mat4.translate(object1.child[1].MOVEMATRIX, object1.child[1].MOVEMATRIX, [0.17, 0.6, 0.4]);

            //mata kiri bawah
            object1.child[2].MOVEMATRIX = glMatrix.mat4.create();
            glMatrix.mat4.rotateY(object1.child[2].MOVEMATRIX, object1.child[2].MOVEMATRIX, THETA);
            glMatrix.mat4.rotateX(object1.child[2].MOVEMATRIX, object1.child[2].MOVEMATRIX, PHI);
            glMatrix.mat4.translate(object1.child[2].MOVEMATRIX, object1.child[2].MOVEMATRIX, [0.17, 0.6, 0.4]);

            //mata kanan atas
            object1.child[3].MOVEMATRIX = glMatrix.mat4.create();
            glMatrix.mat4.rotateY(object1.child[3].MOVEMATRIX, object1.child[3].MOVEMATRIX, THETA);
            glMatrix.mat4.rotateX(object1.child[3].MOVEMATRIX, object1.child[3].MOVEMATRIX, PHI);
            glMatrix.mat4.translate(object1.child[3].MOVEMATRIX, object1.child[3].MOVEMATRIX, [-0.17, 0.6, 0.4]);

            //mata kanan bawah
            object1.child[4].MOVEMATRIX = glMatrix.mat4.create();
            glMatrix.mat4.rotateY(object1.child[4].MOVEMATRIX, object1.child[4].MOVEMATRIX, THETA);
            glMatrix.mat4.rotateX(object1.child[4].MOVEMATRIX, object1.child[4].MOVEMATRIX, PHI);
            glMatrix.mat4.translate(object1.child[4].MOVEMATRIX, object1.child[4].MOVEMATRIX, [-0.17, 0.6, 0.4]);

            //mata kanan hitam
            object1.child[5].MOVEMATRIX = glMatrix.mat4.create();
            glMatrix.mat4.rotateY(object1.child[5].MOVEMATRIX, object1.child[5].MOVEMATRIX, THETA);
            glMatrix.mat4.rotateX(object1.child[5].MOVEMATRIX, object1.child[5].MOVEMATRIX, PHI);
            glMatrix.mat4.translate(object1.child[5].MOVEMATRIX, object1.child[5].MOVEMATRIX, [0.17, 0.6, 0.6]);

            //mata kiri hitam
            object1.child[6].MOVEMATRIX = glMatrix.mat4.create();
            glMatrix.mat4.rotateY(object1.child[6].MOVEMATRIX, object1.child[6].MOVEMATRIX, THETA);
            glMatrix.mat4.rotateX(object1.child[6].MOVEMATRIX, object1.child[6].MOVEMATRIX, PHI);
            glMatrix.mat4.translate(object1.child[6].MOVEMATRIX, object1.child[6].MOVEMATRIX, [-0.17, 0.6, 0.6]);

            //badan
            object1.child[7].MOVEMATRIX = glMatrix.mat4.create();
            glMatrix.mat4.rotateY(object1.child[7].MOVEMATRIX, object1.child[7].MOVEMATRIX, THETA);
            glMatrix.mat4.rotateX(object1.child[7].MOVEMATRIX, object1.child[7].MOVEMATRIX, PHI);
            glMatrix.mat4.translate(object1.child[7].MOVEMATRIX, object1.child[7].MOVEMATRIX, [0.0, -0.7, -0.4]);



            //kaki kanan atas
            object1.child[8].MOVEMATRIX = glMatrix.mat4.create();
            glMatrix.mat4.rotateY(object1.child[8].MOVEMATRIX, object1.child[8].MOVEMATRIX, THETA);
            glMatrix.mat4.rotateX(object1.child[8].MOVEMATRIX, object1.child[8].MOVEMATRIX, PHI);
            glMatrix.mat4.translate(object1.child[8].MOVEMATRIX, object1.child[8].MOVEMATRIX, [0.7,-1.2,0.0]);
            
            // //kaki kanan bawah
            // object1.child[9].MOVEMATRIX = glMatrix.mat4.create();
            // glMatrix.mat4.rotateY(object1.child[9].MOVEMATRIX, object1.child[9].MOVEMATRIX, THETA);
            // glMatrix.mat4.rotateX(object1.child[9].MOVEMATRIX, object1.child[9].MOVEMATRIX, PHI);
            // glMatrix.mat4.translate(object1.child[9].MOVEMATRIX, object1.child[9].MOVEMATRIX, [0.7,-1.2,-0.4]);
            
            //kaki kiri atas
            object1.child[10].MOVEMATRIX = glMatrix.mat4.create();
            glMatrix.mat4.rotateY(object1.child[10].MOVEMATRIX, object1.child[10].MOVEMATRIX, THETA);
            glMatrix.mat4.rotateX(object1.child[10].MOVEMATRIX, object1.child[10].MOVEMATRIX, PHI);
            glMatrix.mat4.translate(object1.child[10].MOVEMATRIX, object1.child[10].MOVEMATRIX, [-0.7,-1.2,0.0]);
            
            // //kaki kiri bawah
            // object1.child[11].MOVEMATRIX = glMatrix.mat4.create();
            // glMatrix.mat4.rotateY(object1.child[11].MOVEMATRIX, object1.child[11].MOVEMATRIX, THETA);
            // glMatrix.mat4.rotateX(object1.child[11].MOVEMATRIX, object1.child[11].MOVEMATRIX, PHI);
            // glMatrix.mat4.translate(object1.child[11].MOVEMATRIX, object1.child[11].MOVEMATRIX, [-1.0,-1.2,-0.4]);

            //tangan kiri atas
            object10.MOVEMATRIX = glMatrix.mat4.create();
            glMatrix.mat4.rotateY(object10.MOVEMATRIX, object10.MOVEMATRIX, THETA);
            glMatrix.mat4.rotateX(object10.MOVEMATRIX, object10.MOVEMATRIX, PHI);
            glMatrix.mat4.translate(object10.MOVEMATRIX, object10.MOVEMATRIX, [-0.6,-0.4,0.5]);

            //tangan kiri bawah
            object10.child[3].MOVEMATRIX = glMatrix.mat4.create();
            glMatrix.mat4.rotateY(object10.child[3].MOVEMATRIX, object10.child[3].MOVEMATRIX, THETA);
            glMatrix.mat4.rotateX(object10.child[3].MOVEMATRIX, object10.child[3].MOVEMATRIX, PHI);
            glMatrix.mat4.translate(object10.child[3].MOVEMATRIX, object10.child[3].MOVEMATRIX, [-0.6,-0.4,0.5]);

            //jari kiri 1
            object10.child[0].MOVEMATRIX = glMatrix.mat4.create();
            glMatrix.mat4.rotateY(object10.child[0].MOVEMATRIX, object10.child[0].MOVEMATRIX, THETA);
            glMatrix.mat4.rotateX(object10.child[0].MOVEMATRIX, object10.child[0].MOVEMATRIX, PHI);
            glMatrix.mat4.translate(object10.child[0].MOVEMATRIX, object10.child[0].MOVEMATRIX, [-0.7, -0.3, 0.6]);

            //jari kiri 2
            object10.child[1].MOVEMATRIX = glMatrix.mat4.create();
            glMatrix.mat4.rotateY(object10.child[1].MOVEMATRIX, object10.child[1].MOVEMATRIX, THETA);
            glMatrix.mat4.rotateX(object10.child[1].MOVEMATRIX, object10.child[1].MOVEMATRIX, PHI);
            glMatrix.mat4.translate(object10.child[1].MOVEMATRIX, object10.child[1].MOVEMATRIX, [-0.8, -0.4, 0.6]);

            //jari kiri 3
            object10.child[2].MOVEMATRIX = glMatrix.mat4.create();
            glMatrix.mat4.rotateY(object10.child[2].MOVEMATRIX, object10.child[2].MOVEMATRIX, THETA);
            glMatrix.mat4.rotateX(object10.child[2].MOVEMATRIX, object10.child[2].MOVEMATRIX, PHI);
            glMatrix.mat4.translate(object10.child[2].MOVEMATRIX, object10.child[2].MOVEMATRIX, [-0.7, -0.5, 0.6]);



            // //tangan kanan atas
            // object14.MOVEMATRIX = glMatrix.mat4.create();
            // glMatrix.mat4.rotateY(object10.MOVEMATRIX, object10.MOVEMATRIX, THETA);
            // glMatrix.mat4.rotateX(object10.MOVEMATRIX, object10.MOVEMATRIX, PHI);
            // glMatrix.mat4.translate(object10.MOVEMATRIX,object10.MOVEMATRIX, [0.6,-0.4,0.5]);

            //tangan kanan bawah
            object14.child[3].MOVEMATRIX = glMatrix.mat4.create();
            glMatrix.mat4.rotateY(object14.child[3].MOVEMATRIX, object14.child[3].MOVEMATRIX, THETA);
            glMatrix.mat4.rotateX(object14.child[3].MOVEMATRIX, object14.child[3].MOVEMATRIX, PHI);
            glMatrix.mat4.translate(object14.child[3].MOVEMATRIX, object14.child[3].MOVEMATRIX, [0.6,-0.4,0.5]);
            
            //jari kanan 1
            object14.child[0].MOVEMATRIX = glMatrix.mat4.create();
            glMatrix.mat4.rotateY(object14.child[0].MOVEMATRIX, object14.child[0].MOVEMATRIX, THETA);
            glMatrix.mat4.rotateX(object14.child[0].MOVEMATRIX, object14.child[0].MOVEMATRIX, PHI);
            glMatrix.mat4.translate(object14.child[0].MOVEMATRIX, object14.child[0].MOVEMATRIX, [0.7, -0.3, 0.6]);
            
            //jari kanan 2
            object14.child[1].MOVEMATRIX = glMatrix.mat4.create();
            glMatrix.mat4.rotateY(object14.child[1].MOVEMATRIX, object14.child[1].MOVEMATRIX, THETA);
            glMatrix.mat4.rotateX(object14.child[1].MOVEMATRIX, object14.child[1].MOVEMATRIX, PHI);
            glMatrix.mat4.translate(object14.child[1].MOVEMATRIX, object14.child[1].MOVEMATRIX, [0.8, -0.4, 0.6]);
            
            //jari kanan 3
            object14.child[2].MOVEMATRIX = glMatrix.mat4.create();
            glMatrix.mat4.rotateY(object14.child[2].MOVEMATRIX, object14.child[2].MOVEMATRIX, THETA);
            glMatrix.mat4.rotateX(object14.child[2].MOVEMATRIX, object14.child[2].MOVEMATRIX, PHI);
            glMatrix.mat4.translate(object14.child[2].MOVEMATRIX, object14.child[2].MOVEMATRIX, [0.7, -0.5, 0.6]);




            

            
            
           // glMatrix.mat4.fromRotationTranslationScaleOrigin(object1.MOVEMATRIX,);
            
          //  console.log(dt); --> untuk menampilkan waktunya di console lewat inspect
            time_prev = time;
        }

        GL.viewport(0,0,CANVAS.width, CANVAS.height);
        GL.clear(GL.COLOR_BUFFER_BIT | GL.D_BUFFER_BIT);
        object1.setUniform4(PROJMATRIX,VIEWMATRIX);
        object1.child[0].setUniform4(PROJMATRIX,VIEWMATRIX);
        object1.child[1].setUniform4(PROJMATRIX,VIEWMATRIX);
        object1.child[2].setUniform4(PROJMATRIX,VIEWMATRIX);
        object1.child[3].setUniform4(PROJMATRIX,VIEWMATRIX);
        object1.child[4].setUniform4(PROJMATRIX,VIEWMATRIX);
        object1.child[5].setUniform4(PROJMATRIX,VIEWMATRIX);
        object1.child[6].setUniform4(PROJMATRIX,VIEWMATRIX);
        object1.child[7].setUniform4(PROJMATRIX,VIEWMATRIX);
        object1.child[8].setUniform4(PROJMATRIX,VIEWMATRIX);
        object1.child[9].setUniform4(PROJMATRIX,VIEWMATRIX);
        object1.child[10].setUniform4(PROJMATRIX,VIEWMATRIX);
        object1.child[11].setUniform4(PROJMATRIX,VIEWMATRIX);

        object10.setUniform4(PROJMATRIX,VIEWMATRIX);
        object10.child[0].setUniform4(PROJMATRIX,VIEWMATRIX);
        object10.child[1].setUniform4(PROJMATRIX,VIEWMATRIX);
        object10.child[2].setUniform4(PROJMATRIX,VIEWMATRIX);
        object10.child[3].setUniform4(PROJMATRIX,VIEWMATRIX);

        object14.setUniform4(PROJMATRIX,VIEWMATRIX);
        object14.child[0].setUniform4(PROJMATRIX,VIEWMATRIX);
        object14.child[1].setUniform4(PROJMATRIX,VIEWMATRIX);
        object14.child[2].setUniform4(PROJMATRIX,VIEWMATRIX);
        object14.child[3].setUniform4(PROJMATRIX,VIEWMATRIX);

        object1.draw();
        object1.child[0].draw();
        object1.child[1].draw();
        object1.child[2].draw();
        object1.child[3].draw();
        object1.child[4].draw();
        object1.child[5].draw();
        object1.child[6].draw();
        object1.child[7].draw();
        object1.child[8].draw();
        object1.child[9].draw();
        object1.child[10].draw();
        object1.child[11].draw();

        object10.draw();
        object10.child[0].draw();
        object10.child[1].draw();
        object10.child[2].draw();
        object10.child[3].draw();

        object14.draw();
        object14.child[0].draw();
        object14.child[1].draw();
        object14.child[2].draw();
        object14.child[3].draw();
        // object2.setUniform4(PROJMATRIX,VIEWMATRIX);
        // object2.draw();

        //DRAWING
        //SEGITIGA yg pointer untuk tau posisi data dr yang -1,-1, dll gt.. 1 nya 4 bit (position 2 , color 3), trus startnya dr 0
        // untuk color sendiri itu 2 * 4 krn 1 float 4 jd krn ingin melewati 2 position itu jd dikali 2 kali 4 biar lewatin jd bs dpt color
     
       

        GL.flush();

        window.requestAnimationFrame(animate);

    };
    animate();



};
window.addEventListener('load', main);