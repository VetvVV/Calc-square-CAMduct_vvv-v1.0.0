/* Calc Square — preview-axo.js
   Цветные параметрические превью (изометрия) для модулей.
   window.CalcSquarePreview(moduleKey, values) -> svg | null
   Свои функции на каждый фитинг; движок их только вызывает. Без внешних сервисов. */
(function(global){
'use strict';
var C_A='#1455ff',C_B='#0a9bb5',C_C='#d81515',C_D='#e08a00',C_E='#0a8a22',C_H='#8b3fd6',C_I='#c2185b';
var BLUE='#1455ff',RED='#d81515',GREEN='#0a8a22';
var EX=[0.8660254,0.5], EY=[-0.8660254,0.5], EZ=[0,-1];
var L10N={
  ru:{front:"Вид спереди",axo:"Аксонометрия"},
  uk:{front:"Вид спереду",axo:"Аксонометрія"},
  en:{front:"Front view",axo:"Axonometric"}
};
var ACTIVE_LANG='ru';
function txt(key){return (L10N[ACTIVE_LANG]||L10N.ru)[key]||L10N.ru[key]||key;}
function vadd(a,b){return [a[0]+b[0],a[1]+b[1]];}
function vmul(v,s){return [v[0]*s,v[1]*s];}
function axo(x,y,z){ return [ x*EX[0]+y*EY[0]+z*EZ[0], x*EX[1]+y*EY[1]+z*EZ[1] ]; }
function clamp(x,a,b){return Math.max(a,Math.min(b,x));}
function unit(a,b){var L=Math.hypot(a,b)||1;return [a/L,b/L];}
function mid(a,b){return [(a[0]+b[0])/2,(a[1]+b[1])/2];}
function centroid(ps){var x=0,y=0;ps.forEach(function(p){x+=p[0];y+=p[1];});return [x/ps.length,y/ps.length];}
function outward(p,cen,d){var v=unit(p[0]-cen[0],p[1]-cen[1]);return [p[0]+v[0]*d,p[1]+v[1]*d];}
function makeFitRegion(points,x0,y0,W,Hh,pad){
  var minX=1e9,maxX=-1e9,minY=1e9,maxY=-1e9;
  points.forEach(function(p){minX=Math.min(minX,p[0]);maxX=Math.max(maxX,p[0]);minY=Math.min(minY,p[1]);maxY=Math.max(maxY,p[1]);});
  var w=Math.max(1,maxX-minX), h=Math.max(1,maxY-minY);
  var s=Math.min((W-2*pad)/w,(Hh-2*pad)/h);
  var tx=x0+(W-w*s)/2, ty=y0+(Hh-h*s)/2;
  var fn=function(p){return [ (p[0]-minX)*s+tx, (p[1]-minY)*s+ty ];};
  fn.s=s; return fn;
}
function makeFit(points,pad){return makeFitRegion(points,0,0,300,220,pad);}
function svgWrapW(inner,W,Hh,disp){return '<svg viewBox="0 0 '+W+' '+Hh+'" width="'+disp+'">'+inner+'</svg>';}
function P(p){return p[0].toFixed(1)+','+p[1].toFixed(1);}
function poly(pts,fill,stroke,sw){return '<polygon points="'+pts.map(P).join(' ')+'" fill="'+fill+'" stroke="'+stroke+'" stroke-width="'+(sw||1)+'"/>';}
function seg(a,b,color,sw){return '<line x1="'+a[0].toFixed(1)+'" y1="'+a[1].toFixed(1)+'" x2="'+b[0].toFixed(1)+'" y2="'+b[1].toFixed(1)+'" stroke="'+color+'" stroke-width="'+sw+'" stroke-linecap="round"/>';}
function lblAt(p,txt,color,anchor){return '<text x="'+p[0].toFixed(1)+'" y="'+(p[1]+4).toFixed(1)+'" fill="'+color+'" font-size="13" font-weight="600" font-style="italic" text-anchor="'+(anchor||'middle')+'">'+txt+'</text>';}
function svgWrap(inner){return '<svg viewBox="0 0 300 220" width="300">'+inner+'</svg>';}

/* ===================== СВОЁ: фитинги ===================== */

function _rectDuct(v){
    var L=v.L,A=v.A,B=v.B;
    var c000=axo(0,0,0), c100=axo(L,0,0), c010=axo(0,A,0), c001=axo(0,0,B),
        c110=axo(L,A,0), c101=axo(L,0,B), c011=axo(0,A,B), c111=axo(L,A,B);
    var f=makeFit([c000,c100,c010,c001,c110,c101,c011,c111],34);
    var M000=f(c000),M100=f(c100),M010=f(c010),M001=f(c001),M110=f(c110),M101=f(c101),M011=f(c011),M111=f(c111);
    var cen=centroid([M000,M100,M010,M001,M110,M101,M011,M111]);
    function edge(a,b,w){return seg(a,b,'#6f7682',w||1.15);}
    function insetQuad(quad,ratio){
      var c=centroid(quad);
      return quad.map(function(p){return [c[0]+(p[0]-c[0])*ratio,c[1]+(p[1]-c[1])*ratio];});
    }
    var g='';
    /* Полный короб: торцы, боковые плоскости и проёмы, чтобы превью читалось как воздуховод. */
    g+=poly([M010,M110,M111,M011],'#dde3ea','#9aa1aa',1.05);
    g+=poly([M100,M110,M111,M101],'#f7f9fb','#7b838f',1.35);
    g+=poly([M001,M101,M111,M011],'#eff3f7','#8a90a0',1.2);
    g+=poly([M000,M100,M101,M001],'#cfd6de','#8a90a0',1.2);
    g+=poly([M000,M010,M011,M001],'#e6ebf0','#6f7682',1.45);
    g+=poly(insetQuad([M000,M010,M011,M001],0.72),'rgba(255,255,255,.55)','#a0a7b0',0.9);
    g+=poly(insetQuad([M100,M110,M111,M101],0.72),'rgba(255,255,255,.7)','#a0a7b0',0.9);
    [[M000,M100],[M010,M110],[M001,M101],[M011,M111],[M000,M010],[M010,M011],[M011,M001],[M100,M110],[M110,M111],[M111,M101]].forEach(function(e){g+=edge(e[0],e[1]);});
    /* цветные рёбра из ближнего угла */
    g+=seg(M000,M100,GREEN,4);
    g+=seg(M000,M010,BLUE,4);
    g+=seg(M000,M001,RED,4);
    g+=lblAt(outward(mid(M000,M100),cen,22),'L '+Math.round(L),GREEN);
    g+=lblAt(outward(mid(M000,M010),cen,22),'A '+Math.round(A),BLUE);
    g+=lblAt(outward(mid(M000,M001),cen,20),'B '+Math.round(B),RED);
    return svgWrap(g);
  }
function _roundDuct(v){
    var L=v.L, rad=v.D/2, N=48;
    function capPt(x,th){return axo(x, rad*Math.cos(th), rad*Math.sin(th));}
    var front=[],back=[];
    for(var i=0;i<N;i++){var th=i/N*2*Math.PI;front.push(capPt(0,th));back.push(capPt(L,th));}
    var f=makeFit(front.concat(back),36);
    var Fm=front.map(f), Bm=back.map(f);
    var perp=[-EX[1],EX[0]];
    var maxI=0,minI=0,maxV=-1e9,minV=1e9;
    for(var k=0;k<N;k++){var th=k/N*2*Math.PI;var u=Math.cos(th)*(EY[0]*perp[0]+EY[1]*perp[1])+Math.sin(th)*(EZ[0]*perp[0]+EZ[1]*perp[1]);if(u>maxV){maxV=u;maxI=k;}if(u<minV){minV=u;minI=k;}}
    var upper=(Fm[minI][1]<Fm[maxI][1])?minI:maxI, lower=(upper===minI)?maxI:minI;
    function path(M){return 'M'+M.map(P).join(' L')+' Z';}
    var cen=centroid(Fm.concat(Bm));
    var g='';
    g+='<path d="'+path(Bm)+'" fill="#f0f0f0" stroke="#bbb" stroke-width="1"/>';
    g+=seg(Fm[lower],Bm[lower],'#bbb',1.5);
    g+=seg(Fm[upper],Bm[upper],GREEN,4);
    g+='<path d="'+path(Fm)+'" fill="#f6f9ff" stroke="'+BLUE+'" stroke-width="3.5"/>';
    g+=lblAt(outward(Fm[minI],cen,26),'⌀'+Math.round(v.D),BLUE,'end');
    g+=lblAt(outward(mid(Fm[upper],Bm[upper]),cen,18),'L '+Math.round(L),GREEN);
    return svgWrap(g);
  }
function _elbow(v){
    var rad=v.ang*Math.PI/180;
    var R=v.R, D=v.D, leg=Math.max(110,R*1.3);
    var dHalf=Math.min(D/2, R*0.62);
    var tlen=R*Math.tan(rad/2);
    var d1=[0,-1], d2=[Math.sin(rad),-Math.cos(rad)];
    var C=[0,0];
    var T1=[0, tlen], T2=[d2[0]*tlen, d2[1]*tlen];
    var P1=[0, tlen+leg], Pe=[d2[0]*(tlen+leg), d2[1]*(tlen+leg)];
    var O=[T1[0]+R, T1[1]];
    var r1=unit(T1[0]-O[0],T1[1]-O[1]), r2=unit(T2[0]-O[0],T2[1]-O[1]);
    function off(p,n,s){return [p[0]+n[0]*s,p[1]+n[1]*s];}
    var P1o=off(P1,r1,dHalf),P1i=off(P1,r1,-dHalf),T1o=off(T1,r1,dHalf),T1i=off(T1,r1,-dHalf);
    var T2o=off(T2,r2,dHalf),T2i=off(T2,r2,-dHalf),Peo=off(Pe,r2,dHalf),Pei=off(Pe,r2,-dHalf);
    var pts=[P1,Pe,T1,T2,O,P1o,P1i,Peo,Pei,T1o,T1i,T2o,T2i,C];
    var f=makeFit(pts,56), s=f.s, M=function(p){return f(p);};
    var Ro=(R+dHalf)*s, Ri=Math.max(2,(R-dHalf)*s), Rc=R*s;
    var cen=centroid([M(P1),M(Pe),M(T1),M(T2),M(O)]);
    var body='M'+P(M(P1o))+' L'+P(M(T1o))+' A'+Ro.toFixed(1)+' '+Ro.toFixed(1)+' 0 0 1 '+P(M(T2o))
      +' L'+P(M(Peo))+' L'+P(M(Pei))+' L'+P(M(T2i))+' A'+Ri.toFixed(1)+' '+Ri.toFixed(1)+' 0 0 0 '+P(M(T1i))+' L'+P(M(P1i))+' Z';
    var arcc='M'+P(M(T1))+' A'+Rc.toFixed(1)+' '+Rc.toFixed(1)+' 0 0 1 '+P(M(T2));
    var capRx=dHalf*s, capRy=capRx*0.36;
    var a1=Math.atan2(r1[1],r1[0])*180/Math.PI, a2=Math.atan2(r2[1],r2[0])*180/Math.PI;
    var P1m=M(P1),Pem=M(Pe),Cm=M(C),ext=M([C[0]+d1[0]*(tlen+leg*0.45),C[1]+d1[1]*(tlen+leg*0.45)]);
    var g='';
    g+='<path d="'+body+'" fill="#ededed" stroke="#9a9a9a" stroke-width="1.3"/>';
    g+='<g transform="translate('+P1m[0].toFixed(1)+','+P1m[1].toFixed(1)+') rotate('+a1.toFixed(1)+')"><ellipse rx="'+capRx.toFixed(1)+'" ry="'+capRy.toFixed(1)+'" fill="#e9e9e9" stroke="#999" stroke-width="1.2"/></g>';
    g+='<path d="'+arcc+'" fill="none" stroke="'+RED+'" stroke-width="3"/>';
    g+='<g transform="translate('+Pem[0].toFixed(1)+','+Pem[1].toFixed(1)+') rotate('+a2.toFixed(1)+')"><ellipse rx="'+capRx.toFixed(1)+'" ry="'+capRy.toFixed(1)+'" fill="#f5f8ff" stroke="'+BLUE+'" stroke-width="3"/></g>';
    g+='<path d="M'+P(Cm)+' L'+P(ext)+'" stroke="#bbb" stroke-width="1" stroke-dasharray="3 3"/>';
    g+=lblAt(outward(M(mid(T1,T2)),cen,20),'R '+Math.round(R),RED);
    g+=lblAt(outward(Pem,cen,capRx+10),'⌀'+Math.round(D),BLUE);
    g+=lblAt(outward(Cm,cen,20),'α '+Math.round(v.ang)+'°',GREEN);
    return svgWrap(g);
  }
function _rectTrans(v){
    var A=v.A,B=v.B,Cc=v.C,Dd=v.D,E=v.E,H=v.H||0,I=v.I||0;
    /* ---------- ВИД СПЕРЕДИ (левая половина) ---------- */
    function fp(wx,hz){return [wx,-hz];}
    var oTL=fp(-A/2,B/2),oTR=fp(A/2,B/2),oBR=fp(A/2,-B/2),oBL=fp(-A/2,-B/2);
    var iTL=fp(H-Cc/2,I+Dd/2),iTR=fp(H+Cc/2,I+Dd/2),iBR=fp(H+Cc/2,I-Dd/2),iBL=fp(H-Cc/2,I-Dd/2);
    var ff=makeFitRegion([oTL,oTR,oBR,oBL,iTL,iTR,iBR,iBL],0,0,232,230,48);
    var MoTL=ff(oTL),MoTR=ff(oTR),MoBR=ff(oBR),MoBL=ff(oBL);
    var MiTL=ff(iTL),MiTR=ff(iTR),MiBR=ff(iBR),MiBL=ff(iBL);
    var MoC=ff([0,0]),MiC=ff([H,-I]),Mh=ff([H,0]);
    var bx0=Math.min(MoTL[0],MoBL[0]),bx1=Math.max(MoTR[0],MoBR[0]),by0=Math.min(MoTL[1],MoTR[1]),by1=Math.max(MoBL[1],MoBR[1]);
    var g='';
    g+='<text x="116" y="16" fill="#888" font-size="12" text-anchor="middle">'+txt('front')+'</text>';
    g+=poly([MoTL,MoTR,MoBR,MoBL],'#f4f4f4','#bbb',1);
    g+=poly([MiTL,MiTR,MiBR,MiBL],'#ffffff','#bbb',1);
    g+=seg(MoTL,MoTR,C_A,3.5);
    g+=seg(MoTL,MoBL,C_B,3.5);
    g+=seg(MiTL,MiTR,C_C,3.2);
    g+=seg(MiTL,MiBL,C_D,3.2);
    if(H!==0||I!==0){
      g+=seg(MoC,Mh,C_H,2.2);
      g+=seg(Mh,MiC,C_I,2.2);
      g+='<circle cx="'+MoC[0].toFixed(1)+'" cy="'+MoC[1].toFixed(1)+'" r="2.4" fill="#666"/>';
      g+='<circle cx="'+MiC[0].toFixed(1)+'" cy="'+MiC[1].toFixed(1)+'" r="2.4" fill="#666"/>';
    }
    g+=lblAt([(bx0+bx1)/2,by0-12],'A '+A,C_A,'middle');
    g+=lblAt([bx0-10,(by0+by1)/2],'B '+B,C_B,'end');
    g+=lblAt([bx1+10,(by0+by1)/2],'C '+Cc,C_C,'start');
    g+=lblAt([(bx0+bx1)/2,by1+18],'D '+Dd,C_D,'middle');
    g+=lblAt([bx0-6,by0-8],'H '+H,C_H,'end');
    g+=lblAt([bx1+6,by1+14],'I '+I,C_I,'start');
    /* ---------- АКСОНОМЕТРИЯ (правая половина) ---------- */
    function cap3(x,cy,cz,wy,hz){return [axo(x,cy+wy/2,cz+hz/2),axo(x,cy+wy/2,cz-hz/2),axo(x,cy-wy/2,cz-hz/2),axo(x,cy-wy/2,cz+hz/2)];}
    var F=cap3(0,0,0,A,B), K=cap3(E,H,I,Cc,Dd);
    var fi=makeFitRegion(F.concat(K),238,0,222,230,40);
    var Fm=F.map(fi),Km=K.map(fi),cen=centroid(Fm.concat(Km));
    g+='<text x="349" y="16" fill="#888" font-size="12" text-anchor="middle">'+txt('axo')+'</text>';
    g+='<line x1="234" y1="24" x2="234" y2="208" stroke="#e2e2e2" stroke-width="1"/>';
    for(var i=0;i<4;i++){var j=(i+1)%4;g+=poly([Fm[i],Fm[j],Km[j],Km[i]],'#ededed','#c8c8c8',1);}
    g+=poly(Fm,'none','#9fb6e6',1.6);
    g+=poly(Km,'none','#e6a3a3',1.6);
    g+=seg(Fm[0],Km[0],C_E,3.5);
    g+=lblAt(outward(mid(Fm[0],Km[0]),cen,18),'E '+Math.round(E),C_E,'middle');
    return svgWrapW(g,460,230,440);
  }

function num(x){return Number(x)||0;}
function resolveTransOffsets(v){
  var A=num(v.A),B=num(v.B),C=num(v.C),D=num(v.D);
  var dAh=(A-C)/2,dBh=(B-D)/2;
  var H=v.H,I=v.I;
  var hh=(typeof H==="number")?H:(H==="right"?-dAh:H==="left"?dAh:0);
  var ii=(typeof I==="number")?I:(I==="top"?dBh:I==="bottom"?-dBh:0);
  return {H:hh,I:ii};
}
global.CalcSquarePreview=function(moduleKey,v,lang){
  try{
    ACTIVE_LANG=L10N[lang]?lang:'ru';
    if(moduleKey==="rectangular-duct") return _rectDuct({A:num(v.A),B:num(v.B),L:num(v.L)});
    if(moduleKey==="round-duct")       return _roundDuct({D:num(v.D),L:num(v.L)});
    if(moduleKey==="round-elbow")      return _elbow({D:num(v.D),R:num(v.R),ang:num(v.Angle)});
    if(moduleKey==="rectangular-transition"){
      var off=resolveTransOffsets(v);
      return _rectTrans({A:num(v.A),B:num(v.B),C:num(v.C),D:num(v.D),E:num(v.E),H:off.H,I:off.I});
    }
  }catch(e){return null;}
  return null;
};
})(window);
