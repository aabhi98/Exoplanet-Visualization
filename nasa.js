// Define constants
const width = window.innerWidth;
const height = window.innerHeight;
const earthRadius = 30;
const planetRadiusMultiplier = 3;
var planet_data;
const earthRadiusThreshold = earthRadius + 50;
var planetsByYear;
var timeoutID;
var timeoutId; // variable to hold the ID of the timeout
var yearData;
let animationPaused = false;
var years;

function sliceData() {
    const sliceInput = document.getElementById('slice-input');
    const sliceValue = parseInt(sliceInput.value);
    console.log("Updated data value:", sliceValue);
  
    // Clear the previously set timeout (if any)
    clearTimeout(timeoutID);
  
    // This will load your two CSV files and store them into two arrays.
    d3.csv("exoplanet_data.csv")
      .then(data => {
        // Convert string values to numbers
        planet_data = data.slice(0, sliceValue).map((d) => {
          return {
            planet_name: d.name,
            distance: +d.distance,
            stellar_magnitude: +d.stellar_magnitude,
            planet_type: d.planet_type,
            discovery_year: +d.discovery_year,
            mass_multiplier: +d.mass_multiplier,
            radius_multiplier: +d.radius_multiplier,
            orbital_radius: +d.orbital_radius,
            orbital_period: +d.orbital_period,
          };
        });
  
        // Filter the data points with distance greater than earthRadiusThreshold
        // planet_data = planet_data.filter(d => d.distance > earthRadiusThreshold);
  
        console.log("planet data",planet_data);
  
        // Define the color scale
        years = Array.from(new Set(planet_data.map(d => d.discovery_year))).sort();
        console.log("years",years)
  
        // Group the planets by year of discovery
        planetsByYear = d3.group(planet_data, d => d.discovery_year);
        console.log("planetsByYear",planetsByYear)
  
        // Draw the planet lines and planets for each year
        let i = 0;
        const drawYearData = () => {
          if (i < years.length) {
            const year = years[i];
            yearData = planetsByYear.get(year);
            planetAnimation(yearData);
            i++;
            timeoutID = setTimeout(drawYearData, 5000);
          }
        };
        drawYearData();
      })
      .catch(error => {
        console.log(error);
      });
  }
  
  // This function is called once the HTML page is fully loaded by the browser
  document.addEventListener('DOMContentLoaded', function () {
    //calling the function with updated data point value
    sliceData();

    document.getElementById("play-button").addEventListener("click", () => {
        console.log("Play button pressed");
        animationPaused = false;
        const currentYear = yearData[0].discovery_year; // get the year where the animation was paused
        const currentIndex = years.indexOf(currentYear); // get the index of the year in the years array
        const remainingYears = years.slice(currentIndex); // get the remaining years to be animated
        const remainingData = remainingYears.map(year => planetsByYear.get(year)).flat(); // get the remaining data points to be animated
        let i = currentIndex+1;
        const drawYearData = () => {
          if (i < remainingYears.length) {
            const year = remainingYears[i];
            yearData = planetsByYear.get(year);
            planetAnimation(yearData);
            i++;
            timeoutID = setTimeout(drawYearData, 5000);
          }
        };
        drawYearData();
      });
      
      
      document.getElementById("stop-button").addEventListener("click", () => {
        console.log("Stop button pressed")
        animationPaused = true;
        clearTimeout(timeoutID); // change timeoutId to timeoutID
      });

      document.getElementById("replay-button").addEventListener("click", () =>{
        console.log("Replay button pressed");
        sliceData();
      })
  });
  



function planetAnimation(data){

    if(animationPaused) {
        return; // exit function if animation is paused
      }
    
   const colorScale = d3.scaleOrdinal()
   .domain(['Gas Giant', 'Super Earth', 'Terrestrial', 'Neptune-like', 'Jovian', 'Sub-Neptune', 'Unknown'])
   .range(['#00a1f5', '#87d37c', '#f4d03f', '#ff0000', '#f03434', '#f39c12', '#bdc3c7']);
 


   // Define the brightness scale
    const brightnessScale = d3
        .scaleLinear()
        .domain(d3.extent(data, (d) => d.stellar_magnitude))
        .range([0.2, 1]); // set the range of opacity values

    // Create the SVG element
    const svg = d3.select("#svg_viz")
    .attr("viewBox", [-width/2 - 50, -height/2 - 50, width + 100, height + 100]);

    // Add the Earth image to the center of the SVG
    svg.append("svg:image")
        .attr("xlink:href", "https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/The_Earth_seen_from_Apollo_17.jpg/1280px-The_Earth_seen_from_Apollo_17.jpg")
        .attr("x", -earthRadius)
        .attr("y", -earthRadius)
        .attr("width", earthRadius * 2)
        .attr("height", earthRadius * 2)
        .attr("clip-path", "circle(" + earthRadius + "px)")
        .style("z-index", 1);
    
    const currentYear = data[0].discovery_year; // Get the current year from the data
    const currentYearData = planetsByYear.get(currentYear);
    svg.select(".year-text").remove(); 
    svg.append("text") // Add a text element to the SVG
        .attr("class", "year-text")
        .attr("x", width / 2 - 250) // Set the x position to the right edge of the SVG
        .attr("y", -height / 2 + 100) // Set the y position to the top edge of the SVG
        .attr("font-size", "100px") // Set the font size
        .attr("fill", "white") // Set the font color
        .text(currentYear)
        .transition()
        .duration(1000)
        .delay((d, i) => i * 100); // Set the text content to the current year

    svg.select(".planet-count-text").remove();
    svg.append("text")
        .attr("class", "planet-count-text")
        .attr("x", width / 2 - 350)
        .attr("y", -height / 2 + 200)
        .attr("font-size", "50px")
        .attr("fill", "white")
        .text(`Exoplanets: ${currentYearData.length}`);
        

   const interval = 5000; // Set the interval to 5000 milliseconds

   const getPlanetPosition = (distance, orbitalRadius) => {
     const currentTime = Date.now(); // Get the current time in milliseconds
     const angle = ((currentTime / interval) * 2 * Math.PI) % (2 * Math.PI); // Calculate the angle based on the current time and interval
     const x = distance * Math.cos(angle + orbitalRadius);
     const y = distance * Math.sin(angle + orbitalRadius);
     return { x, y };
   };


   const planetLines = svg.selectAll("line")
   .data(data)
   .join("line")
   .attr("class","line")
   .attr("stroke", d => colorScale(d.planet_type)) // use the color scale for planet_type
   .attr("stroke-opacity", (d) => brightnessScale(d.stellar_magnitude))
   .attr("x1", 0)
   .attr("y1", 0)
   .attr("x2", 0)
   .attr("y2", 0)
   .on("mouseover", function(d) {
    // Highlight the line being hovered over
    d3.select(this)
      .attr("stroke-width", 3)
      .attr("stroke-opacity", 1);
     
    // Dim all other lines
    svg.selectAll("line:not(:hover)")
      .attr("stroke-opacity", 0.2);
 
    // Highlight the label attached to the line being hovered over
    svg.select(`.planet-label-${d.planet_name}`)
      .attr("font-weight", "bold")
      .attr("opacity", 1);
 
    // Highlight the circle attached to the line being hovered over
    svg.select(`#circle-${d.planet_name}`)
      .attr("stroke-width", 3)
      .attr("stroke-opacity", 1)
      .attr("opacity", 1);
 
    // Dim all other circles and labels
    svg.selectAll("circle:not(:hover)")
      .attr("opacity", 0.2);
 
    svg.selectAll(".planet-label:not(:hover)")
      .attr("font-weight", "normal")
      .attr("opacity", 0.2);
    })
    .on("mouseout", function(d) {
    // Reset the line to its original state
    d3.select(this)
      .attr("stroke-width", 1)
      .attr("stroke-opacity", (d) => brightnessScale(d.stellar_magnitude));
     
    // Return all other lines to their original state
    svg.selectAll("line:not(:hover)")
      .attr("stroke-opacity", (d) => brightnessScale(d.stellar_magnitude));
 
    // Reset the label attached to the line to its original state
    svg.select(`.planet-label-${d.planet_name}`)
      .attr("font-weight", "normal")
      .attr("opacity", 1);
 
    // Reset the circle attached to the line to its original state
    svg.select(`#circle-${d.planet_name}`)
      .attr("stroke-width", 1)
      .attr("stroke-opacity", (d) => brightnessScale(d.stellar_magnitude))
      .attr("opacity", (d) => brightnessScale(d.stellar_magnitude));
 
    // Reset all other circles and labels to their original state
    svg.selectAll("circle:not(:hover)")
      .attr("opacity", (d) => brightnessScale(d.stellar_magnitude));
 
    svg.selectAll(".planet-label:not(:hover)")
      .attr("font-weight", "normal")
      .attr("opacity", 1);
    })
   .transition()
   .duration(1000)
   .delay((d, i) => i * 100)
   .attr("x1", 0)
   .attr("y1", 0)
   .attr("x2", (d) => getPlanetPosition(d.distance, d.orbital_radius).x * planetRadiusMultiplier)
   .attr("y2", (d) => getPlanetPosition(d.distance, d.orbital_radius).y * planetRadiusMultiplier);
    
// Draw the planets
const planets = svg.selectAll("circle")
  .data(data)
  .join("circle")
  .attr("class","circle")
  .attr("fill", d => colorScale(d.planet_type)) // use the color scale for planet_type
  .attr("cx", 0)
  .attr("cy", 0)
  .attr("r", 0)
  .attr("opacity", (d) => brightnessScale(d.stellar_magnitude))
  .on("mouseover", function(d) {
    // Highlight the circle being hovered over
    d3.select(this)
      .attr("stroke-width", 3)
      .attr("stroke-opacity", 1)
      .attr("opacity", 1);

    // Highlight the line attached to the circle being hovered over
    svg.select(`line[stroke="${colorScale(d.planet_type)}"][stroke-opacity="${brightnessScale(d.stellar_magnitude)}"]`)
        .attr("stroke-width", 3)
        .attr("stroke-opacity", 1);
    
    // Dim all other circles
    svg.selectAll("circle:not(:hover)")
      .attr("opacity", 0.2);
  })
  .on("mouseout", function(d) {
    // Reset the line to its original state
    d3.select(this)
      .attr("stroke-width", 1)
      .attr("stroke-opacity", (d) => brightnessScale(d.stellar_magnitude));
    
    // Return all other lines to their original state
    svg.selectAll("circle:not(:hover)")
        .attr("opacity", (d) => brightnessScale(d.stellar_magnitude));
  })
  .transition()
  .duration(1000)
  .delay((d, i) => i * 100)
  .attr("cx", (d) => getPlanetPosition(d.distance, d.orbital_radius).x * planetRadiusMultiplier)
  .attr("cy", (d) => getPlanetPosition(d.distance, d.orbital_radius).y * planetRadiusMultiplier)
  .attr("r", (d) => d.radius_multiplier * earthRadius);


  const planetLabels = svg.selectAll(".planet-label")
  .data(data)
  .join("text")
  .text(d => `(name: ${d.planet_name}, distance: ${d.distance} ly)`)
  .attr("class", "planet-label")
  .style("font-size", "16px") // set the font size to 16 pixels
  .transition()
  .duration(1000)
  .delay((d, i) => i * 100)
  .attr("x", (d) => getPlanetPosition(d.distance, d.orbital_radius).x * planetRadiusMultiplier + 30) // set the x position to the right of the circle
  .attr("y", (d) => getPlanetPosition(d.distance, d.orbital_radius).y * planetRadiusMultiplier - 50) // move the label above the circle
  .attr("text-anchor", "start")
  .attr("alignment-baseline", "middle")
  .attr("fill", d => colorScale(d.planet_type));

//   timeoutId = setTimeout(() => {
//     console.log("timeout entered")
//     planetAnimation(data); // recursively call planetAnimation() after timeout
//   }, interval);

 }

