var ctx, knots, tension = 1;

function circle(x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2*Math.PI);
  ctx.stroke();
}

function curve(knots, offset, cycle) {
  var off = offset || [0, 0];

  ctx.strokeStyle = 'black';
  ctx.beginPath();

  for (var i=0; i<knots.length-1; i++) {
    // console.log('moveTo', knots[i].x_pt.toFixed(4), knots[i].y_pt.toFixed(4));
    // console.log('bezierCurveTo', knots[i].rx_pt.toFixed(4), knots[i].ry_pt.toFixed(4) ,
    //   knots[i+1].lx_pt.toFixed(4), knots[i+1].ly_pt.toFixed(4),
    //   knots[i+1].x_pt.toFixed(4), knots[i+1].y_pt.toFixed(4));

    ctx.moveTo(off[0] + knots[i].x_pt, off[1] + knots[i].y_pt);
    ctx.bezierCurveTo(
      off[0] + knots[i].rx_pt, off[1] + knots[i].ry_pt ,
      off[0] + knots[i+1].lx_pt, off[1] + knots[i+1].ly_pt,
      off[0] + knots[i+1].x_pt, off[1] + knots[i+1].y_pt);
    ctx.stroke();

    circle(off[0] + knots[i].x_pt,  off[1] + knots[i].y_pt, 3);
    circle(off[0] + knots[i].rx_pt, off[1] + knots[i].ry_pt , 1);
    circle(off[0] + knots[i+1].lx_pt, off[1] + knots[i+1].ly_pt, 1);
    circle(off[0] + knots[i+1].x_pt,  off[1] + knots[i+1].y_pt, 3);
  }
  if (cycle) {
    i = knots.length-1;
    ctx.moveTo(off[0] + knots[i].x_pt, off[1] + knots[i].y_pt);
    ctx.bezierCurveTo(
      off[0] + knots[i].rx_pt, off[1] + knots[i].ry_pt ,
      off[0] + knots[0].lx_pt, off[1] + knots[0].ly_pt,
      off[0] + knots[0].x_pt, off[1] + knots[0].y_pt);
    ctx.stroke();
  }
}

function test() {
  var p;
  ctx.clearRect(0, 0, 600, 770);

  // p = [ [0, 0], [100, 200], [200, 100]];
  p = [[0, 0], [200, 133], [130, 300], [33, 233], [100, 167]];
  // p = [[30,50],[10,70],[40,90],[60,40],[0,0]];
  // p = [[0,0], [60,40], [40,90], [10,70], [30,50]];
  // p = [[0, 0],[100, 100],[200, 0], [0, 0]];
  // p = [[0,0],[28,32],[32,80],[40,160],[0,200],[-40,140],[-32,80],[-32,40],[0,0]];
  knots = makeknots(p, tension, true);
  mp_make_choices(knots[0]);
  curve(knots, [50, 100], true);

  knots = makeknots(p, tension, false);
  mp_make_choices(knots[0]);
  curve(knots, [300, 100], false);
}

function init() {
    var canvas = document.getElementById("canvas");
    ctx = canvas.getContext("2d");
    test();
}
