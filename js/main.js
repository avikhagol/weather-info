$(document).ready(function(){
    let utcOffsetHours = 0; 


    $(function() {
        $("#city").autocomplete({
            source: function(request, response) {
                $.ajax({
                    url: "https://geocoding-api.open-meteo.com/v1/search",
                    data: {
                        name: request.term,
                        count: 10,
                        language: "en",
                        format: "json"
                    },
                    success: function(data) {
                        if (data.results) {
                            response($.map(data.results, function(item) {
                                console.log(item);
                                return {
                                    label: item.name + ", " + (item.country || ""),
                                    value: item.name,
                                    lat: item.latitude,
                                    lon: item.longitude
                                };
                            }));
                        } else {
                            response([]);
                        }
                    }
                });
            },
            select: function(event, ui) {
                $("form.lat-long input#lat").val(ui.item.lat);
        
                // Fill longitude
                $("form.lat-long input#lon").val(ui.item.lon);

                // $.ajax({
                //     url: "http://api.geonames.org/timezoneJSON",
                //     data: {
                //         lat: latitude,
                //         lng: longitude,
                //         username: "YOUR_USERNAME"  // free account username
                //     },
                //     success: function(data) {
                //         if (data && data.gmtOffset !== undefined) {
                //             const utcOffsetHours = data.gmtOffset; // hours
                //             console.log("UTC offset:", utcOffsetHours);
                //         }
                //     }
                // });


            },
            minLength: 2
        });
    });


    $( "button.continue" ).on("click", function() {
        var lat = $("form input#lat.inp").val();
        var long = $("form input#lon.inp").val();
        // console.log(lat);
        $.ajax({
        url: "http://www.7timer.info/bin/api.pl",
        data: {
            lon: long,
            lat: lat,
            product: "civil",
            output: "json"
        },
        success: function( result ) {

            extractedinfo = apidecode(result);
            console.log(extractedinfo);
            

            $(".weather-res").html(""); // clear previous cards
            let lastDate = ""; 
            let rowDiv = null;

            extractedinfo.forEach(einfo => {
                const iconClass = (einfo.weather.code === "cloudyday")
                    ? "cloudyday"
                    : (einfo.weather.code === "cloudynight")
                    ? "cloudynight"
                    : einfo.weather.code; // fallback if other icons exist

                const forecastDate = getForecastDate(einfo.init, einfo.timepoint);
                const localDate = new Date(forecastDate.getTime() + utcOffsetHours * 3600 * 1000);
                const dateStr = localDate.toISOString().slice(0,10); // YYYY-MM-DD
                const timeStr = localDate.toISOString().slice(11,16); // HH:MM

                // New date → create heading and row container
                if (dateStr !== lastDate) {
                    lastDate = dateStr;

                    $(".weather-res").append(`<h2 class="card-title">${dateStr}</h2>`);
                    rowDiv = $(`<div class="weather-row"></div>`);
                    $(".weather-res").append(rowDiv);
                }

                // Small weather card
                const cardHtml = `
                    <div class="card">
                        <h3>${timeStr} UTC</h3>
                        <div class="weather-icon ${iconClass}"></div>
                        <div class="container">
                            <h4><b>${einfo.weather.description}</b></h4>
                            <p>Clouds: ${einfo.cloudcover.meaning}</p>
                            <p>Temp: ${einfo.temp2m}°C</p>
                            <p>Humidity: ${einfo.rhumidity}%</p>
                            <p>Wind: ${einfo.wind10m.meaning} m/s (${einfo.wind10m.direction})</p>
                        </div>
                    </div>
                `;

                // Append card to current row
                rowDiv.append(cardHtml);
            });

        }
        })
    }
        
    )


    // $("Input.lat").

    
});

function getForecastDate(init, timepoint) {
    const year = parseInt(init.slice(0, 4));
    const month = parseInt(init.slice(4, 6)) - 1; // JS months 0-11
    const day = parseInt(init.slice(6, 8));
    const hour = parseInt(init.slice(8, 10));
    const date = new Date(Date.UTC(year, month, day, hour));
    date.setUTCHours(date.getUTCHours() + timepoint);
    return date;
}

function apidecode(apires) {
    let data;
    try {
        data = JSON.parse(apires);
    } catch (e) {
        console.error("Invalid JSON:", e);
        return [];
    }

    if (!data.dataseries) return [];

    const weatherMap = {
        lightrainday: "Light Rain (Day)",
        lightrainnight: "Light Rain (Night)",
        tsnight: "Thunderstorm (Night)",
        oshowerday: "Occasional Showers (Day)",
        cloudyday: "Cloudy (Day)",
        cloudynight: "Cloudy (Night)",
        pcloudyday: "Partly Cloudy (Day)",
        pcloudynight: "Partly Cloudy (Night)",
        mcloudyday: "Mostly Cloudy (Day)",
        mcloudynight: "Mostly Cloudy (Night)",
        clearday: "Clear (Day)",
        clearnight: "Clear (Night)"
    };

    const cloudcoverMap = {
        1: "0%-6%",
        2: "6%-19%",
        3: "19%-31%",
        4: "31%-44%",
        5: "44%-56%",
        6: "56%-69%",
        7: "69%-81%",
        8: "81%-94%",
        9: "94%-100%",
    }

    const seeingMap = {
    1: "≤0.5 arcsec (Excellent)",
    2: "0.5-0.75 arcsec (Very Good)",
    3: "0.75-1.0 arcsec (Good)",
    4: "1.0-1.25 arcsec (Average)",
    5: "1.25-1.5 arcsec (Poor)",
    6: "1.5-2.0 arcsec (Very Poor)",
    7: "≥2.0 arcsec (Bad)",
    8: "Extremely bad"
    };

    const transparencyMap = {
    1: "Perfectly transparent",
    2: "Extremely transparent",
    3: "Very transparent",
    4: "Transparent",
    5: "Average",
    6: "Translucent",
    7: "Opaque",
    8: "Extremely opaque"
    };

    const liftedIndexMeaning = value => {
    if (value >= 6) return "Very stable";
    if (value >= 1) return "Stable";
    if (value >= -1) return "Slightly unstable";
    if (value >= -4) return "Unstable";
    if (value >= -6) return "Very unstable";
    return "Extremely unstable";
    };

    const windspeedMap = {
        1: "Below 0.3 m/s (Calm)",
        2: "0.3-3.4 m/s (Light)",
        3: "3.4-8.0 m/s (Moderate)",
        4: "8.0-10.8 m/s (Fresh)",
        5: "10.8-17.2 m/s (Strong)",
        6: "17.2-24.5 m/s (Gale)",
        7: "24.5-32.6 m/s (Storm)",
        8: "Over 32.6 m/s (Hurricane)"
    };



    return data.dataseries.map(entry => ({
        init: data.init,
        timepoint: entry.timepoint,
        temp2m: entry.temp2m,
        rhumidity: entry.rh2m,
        precipitation: entry.prec_type === "none" 
            ? { type: "none", amount_mm: 0 } 
            : { type: entry.prec_type, amount_mm: entry.prec_amount },
        wind10m: {
            direction: entry.wind10m.direction,
            speed: entry.wind10m.speed,
            meaning: windspeedMap[entry.wind10m.speed] || "Unknown"
        },
        weather: {
            code: entry.weather,
            description: weatherMap[entry.weather] || entry.weather
        },
        cloudcover: {
            code: entry.cloudcover,
            meaning: cloudcoverMap[entry.cloudcover] || "Unknown"
        },
        seeing: {
            code: entry.seeing,
            meaning: seeingMap[entry.seeing] || "Unknown"
        },
        transparency: {
            code: entry.transparency,
            meaning: transparencyMap[entry.transparency] || "Unknown"
        },
        lifted_index: {
            value: entry.lifted_index,
            meaning: liftedIndexMeaning(entry.lifted_index)
        }
    }));
}


// function apidecode(apires) {
//     // Step 1: Parse text into JSON
//     let data;
//     try {
//         data = JSON.parse(apires);
//     } catch (e) {
//         console.error("Invalid JSON:", e);
//         return [];
//     }

//     if (!data.dataseries) return [];

//     // Step 2: Mapping table for weather codes
    



//     // Step 3: Transform into a more readable JSON
//     return data.dataseries.map(entry => ({
//         timepoint: entry.timepoint,
//         temp2m: entry.temp2m,
//         rhumidity: entry.rh2m,
//         precipitation: entry.prec_type === "none" 
//             ? { type: "none", amount_mm: 0 } 
//             : { type: entry.prec_type, amount_mm: entry.prec_amount },
//         wind10m: {
//             direction: entry.wind10m.direction,
//             speed: entry.wind10m.speed
//         },
//         weather: {
//             code: entry.weather,
//             description: weatherMap[entry.weather] || entry.weather
//         },
//         cloudcover: {cloudcover: entry.cloudcover,
//             meaning: cloudcoverMap[entry.cloudcover]
//         },
//         seeing: entry.seeing,
//         transparency: entry.transparency,
//         lifted_index: entry.lifted_index
//     }));
// }
