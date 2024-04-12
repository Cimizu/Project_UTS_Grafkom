// biar jd variable global
var GL;
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

}
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

    // KEPALA 
    var object_vertex = [];
    var i,j;
	i=0;
	for(var u=-Math.PI;u<=Math.PI;u+=Math.PI/160)
	{	j=0;
		for(var v=-Math.PI/2;v<Math.PI/2;v+=Math.PI/160)
		{	object_vertex.push(1*Math.cos(v)* Math.cos(u));
			object_vertex.push(1 *Math.cos(v)* Math.sin(u));
			object_vertex.push(1 * Math.sin(v));
            object_vertex.push(1);
            object_vertex.push(1);
            object_vertex.push(1);
			j++;
		}
		i++;
	};
    var object_faces = [];
    for (i = 0 ; i <= object_vertex.length ; i++){
        object_faces.push(0);
        object_faces.push(i);
        object_faces.push(i+1);

    };

    var object1 = new myObject(object_vertex,object_faces,shader_vertex_source,shader_fragment_source);
    
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
            LIBS.set_I4(object1.MOVEMATRIX);

            // harus urut z ,y,x agar muternya benar 
            // LIBS.rotateY(object1.MOVEMATRIX, THETA);
            // LIBS.rotateX(object1.MOVEMATRIX, PHI);
            temp = LIBS.get_I4();
            LIBS.translateX(temp,1);
            object1.MOVEMATRIX= LIBS.mul(object1.MOVEMATRIX,temp);
            temp = LIBS.get_I4();
            LIBS.rotateY(temp,THETA);
            object1.MOVEMATRIX =LIBS.mul(object1.MOVEMATRIX,temp);
            temp = LIBS.get_I4();
            LIBS.translateX(temp,-1);
            object1.MOVEMATRIX =LIBS.mul(object1.MOVEMATRIX,temp);
            
            //console.log(dt); --> untuk menampilkan waktunya di console lewat inspect
            time_prev = time;
        }

        GL.viewport(0,0,CANVAS.width, CANVAS.height);
        GL.clear(GL.COLOR_BUFFER_BIT | GL.D_BUFFER_BIT);
        object1.setUniform4(PROJMATRIX,VIEWMATRIX);
        object1.draw();

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