
var element = d3.select('#container').node();
var viewportWidth = element.getBoundingClientRect().width;
var width = viewportWidth * 0.97;
var height = width/1.85;

// function resize(){
//   console.log(arguments);
// }

// d3.select(window).on('resize', resize);


d3.select(window).on('resize', resize);

function resize() {

    viewportWidth = element.getBoundingClientRect().width;
    width = viewportWidth * 0.97;
    height = width/1.85;

   // projection
   //    .scale([width/3.5])
   //    .translate([width/1,height*1.4]);


   // d3.select("article").attr("width",width).attr("height",height);
   // d3.select("svg").attr("width",width).attr("height",height);

   // d3.selectAll("path").attr('d', path);


}
