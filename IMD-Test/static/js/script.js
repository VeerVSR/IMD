// Initialize Leaflet map
L.Icon.Default.imagePath = '/static/libs/images/';

var map = L.map('map').setView([20.5937, 78.9629], 5);  // Centered on India

// Add base map layer (e.g., OpenStreetMap)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

//CSV files
// load CSV data for warnings
let warningImpacts = {};
let warningSafetyMeasures = {};
const allWarningsSet = new Set();

function loadCSV(url, callback) {
    fetch(url)
        .then(res => res.text())
        .then(text => {
            const lines = text.trim().split('\n');
            const data = {};
            lines.forEach(line => {
                const [warning, value] = line.split(',');
                const w = warning.trim();
                const v = value.trim();
                if (!data[w]) data[w] = [];
                data[w].push(v);
                allWarningsSet.add(w);
            });
            callback(data);
        });
}

// later, when needed:
const allWarnings = Array.from(allWarningsSet).sort();


// load CSVs at page load
loadCSV('/static/data/impacts.csv', data => { warningImpacts = data; });
loadCSV('/static/data/safetymeasures.csv', data => { warningSafetyMeasures = data; });


// Load and display the GeoJSON file with transparency and light gray color
fetch('static/states_india.geojson')
    .then(response => response.json())
    .then(geojsonData => {
        L.geoJSON(geojsonData, {
            style: function (feature) {
                return {
                    color: '#4682B4',  // Line color (light gray)
                    weight: 2,         // Line width
                    opacity: 0.7,      // Line transparency
                    fillOpacity: 0     // Fill transparency (fully transparent)
                };
            }
        }).addTo(map);
    })
    .catch(error => {
        console.error('Error loading GeoJSON:', error);
    });


    var intersectionsByDay = {
        1: { layer: L.layerGroup(), data: [] },
        2: { layer: L.layerGroup(), data: [] },
        3: { layer: L.layerGroup(), data: [] },
        4: { layer: L.layerGroup(), data: [] },
        5: { layer: L.layerGroup(), data: [] },
        6: { layer: L.layerGroup(), data: [] },
        7: { layer: L.layerGroup(), data: [] }
    };

    var allIntersections = {};
    
    
    function addIntersectionToDay(day, intersectionGeoJson) {
        if (intersectionsByDay[day]) {
            L.geoJSON(intersectionGeoJson, {
                style: { color: 'blue' } // Customize style if needed
            }).addTo(intersectionsByDay[day]);
        }
    }
function calculateAndAddIntersections(day) {
    // Assuming you have a function to calculate intersections
    var intersectionGeoJson = calculateIntersectionsForDay(day);

    if (intersectionGeoJson) {
        addIntersectionToDay(day, intersectionGeoJson);
    }
}

    
// Initialize Leaflet Draw
var layersByDay = {
    1: new L.FeatureGroup(),
    2: new L.FeatureGroup(),
    3: new L.FeatureGroup(),
    4: new L.FeatureGroup(),
    5: new L.FeatureGroup(),
    6: new L.FeatureGroup(),
    7: new L.FeatureGroup()
};
map.addLayer(layersByDay[1]);

var drawControl = new L.Control.Draw({
    draw: {
        polygon: true,
        polyline: false,
        circle: false,
        marker: true,
        circlemarker: false
    },
    edit: {
        featureGroup: layersByDay[1],
        remove: true
    }
});
map.addControl(drawControl);

var formsContainer = document.getElementById('forms-container');

// Define warning icons
var warningIcons = {
    "Heavy Rain": L.icon({ iconUrl: 'static/icons/004-rain-1.png', iconSize: [32, 32] }),
    "Very Heavy Rain": L.icon({ iconUrl: 'static/icons/003-rain.png', iconSize: [32, 32] }),
    "Extremely Heavy Rain": L.icon({ iconUrl: 'static/icons/002-rainy.png', iconSize: [32, 32] }),
    "Heavy Snow": L.icon({ iconUrl: 'static/icons/005-snow.png', iconSize: [32, 32] }),
    "Thunderstorm & Lightning": L.icon({ iconUrl: 'static/icons/006-thunder.png', iconSize: [32, 32] }),
    "Hailstorm": L.icon({ iconUrl: 'static/icons/007-hailstorm.png', iconSize: [32, 32] }),
    "Dust Storm": L.icon({ iconUrl: 'static/icons/008-dust-storm.png', iconSize: [32, 32] }),
    "Dust Raising Winds": L.icon({ iconUrl: 'static/icons/009-dust-raising-winds.png', iconSize: [32, 32] }),
    "Strong Surface Winds": L.icon({ iconUrl: 'static/icons/010-strong-surface-winds.png', iconSize: [32, 32] }),
    "Heat Wave": L.icon({ iconUrl: 'static/icons/011-heat-wave.png', iconSize: [32, 32] }),
    "Hot Day": L.icon({ iconUrl: 'static/icons/014-hot-day.png', iconSize: [32, 32] }),
    "Hot and Humid": L.icon({ iconUrl: 'static/icons/012-humidity.png', iconSize: [32, 32] }),
    "Warm Night": L.icon({ iconUrl: 'static/icons/013-warm-night.png', iconSize: [32, 32] }),
    "Cold Wave": L.icon({ iconUrl: 'static/icons/003-rain.png', iconSize: [32, 32] }),
    "Cold Day": L.icon({ iconUrl: 'static/icons/003-rain.png', iconSize: [32, 32] }),
    "Ground Frost": L.icon({ iconUrl: 'static/icons/015-ice.png', iconSize: [32, 32] }),
    "Fog": L.icon({ iconUrl: 'static/icons/016-fog.png', iconSize: [32, 32] }),
};

// Handle draw events
map.on(L.Draw.Event.CREATED, function (event) {
    var layer = event.layer;

    // Initialize attributes
    layer.feature = {
        type: 'Feature',
        properties: {
            Warning: null,
            Color: null,
            Date: getDateForDay(activeTab),
            ExpectedImpacts: [], // Initialize as array
            SafetyMeasures: []   // Initialize as array
        },
        geometry: {}
    };

    // Set initial style to blue
    layer.setStyle({ color: 'blue' });

    // Add the layer to the feature group for the active day
    layersByDay[activeTab].addLayer(layer);

    // Create a new form for the layer
    createForm(layer, true);

    // Check for intersections
    updateIntersectionIcons();
});

function handleIntersections() {
    var allLayers = [];
    for (var day in layersByDay) {
        layersByDay[day].eachLayer(function(layer) {
            if (layer instanceof L.Polygon) {
                allLayers.push(layer);
            }
        });
    }

    allLayers.forEach(function(layer1) {
        allLayers.forEach(function(layer2) {
            if (layer1 !== layer2) {
                var intersection = layer1.getBounds().intersects(layer2.getBounds());
                if (intersection) {
                    var layer1Poly = layer1.toGeoJSON().geometry.coordinates[0];
                    var layer2Poly = layer2.toGeoJSON().geometry.coordinates[0];
                    var intersectionPoints = turf.intersect(layer1.toGeoJSON(), layer2.toGeoJSON());
                    if (intersectionPoints) {
                        var intersectionLayer = L.geoJSON(intersectionPoints, {
                            style: {
                                color: 'purple',  // Color of intersection area
                                weight: 2
                            }
                        }).addTo(map);

                        // Add warning icons for intersection
                        var warningIconsSet = new Set();
                        if (layer1.feature.properties.Warning) {
                            warningIconsSet.add(layer1.feature.properties.Warning);
                        }
                        if (layer2.feature.properties.Warning) {
                            warningIconsSet.add(layer2.feature.properties.Warning);
                        }
                        warningIconsSet.forEach(function(warning) {
                            if (warningIcons[warning]) {
                                var latLng = intersectionLayer.getBounds().getCenter();
                                L.marker(latLng, { icon: warningIcons[warning] }).addTo(map);
                            }
                        });
                    }
                }
            }
        });
    });
}

// Handle file upload
function handleFileUpload(event) {
    var file = event.target.files[0];
    if (!file) {
        // Display a message to the user instead of alert()
        showMessageBox("No file selected.");
        return;
    }

    var reader = new FileReader();
    reader.onload = function(e) {
        try {
            var geojsonData = JSON.parse(e.target.result);

            L.geoJSON(geojsonData, {
                onEachFeature: function (feature, layer) {
                    // Ensure properties are initialized for uploaded layers
                    if (!layer.feature || !layer.feature.properties) {
                        layer.feature = {
                            type: 'Feature',
                            properties: {
                                Warning: null,
                                Color: null,
                                Date: getDateForDay(activeTab),
                                ExpectedImpacts: [],
                                SafetyMeasures: []
                            },
                            geometry: feature.geometry
                        };
                    } else {
                        // Ensure ExpectedImpacts and SafetyMeasures are arrays
                        if (!Array.isArray(layer.feature.properties.ExpectedImpacts)) {
                            layer.feature.properties.ExpectedImpacts = layer.feature.properties.ExpectedImpacts ? layer.feature.properties.ExpectedImpacts.split(', ').map(s => s.trim()) : [];
                        }
                        if (!Array.isArray(layer.feature.properties.SafetyMeasures)) {
                            layer.feature.properties.SafetyMeasures = layer.feature.properties.SafetyMeasures ? layer.feature.properties.SafetyMeasures.split(', ').map(s => s.trim()) : [];
                        }
                    }
                    layersByDay[activeTab].addLayer(layer);
                    // Do not create form for uploaded layers immediately, they will be generated on tab switch
                }
            }).addTo(map);

            // Upload the file to the server
            var formData = new FormData();
            formData.append('file', file);

            fetch('/upload', {
                method: 'POST',
                body: formData
            })
            .then(response => response.text())
            .then(data => {
                showMessageBox("File uploaded successfully.");
                updateFormsForActiveDay(); // Refresh forms to show newly added layers
            })
            .catch(error => {
                console.error('Error:', error);
                showMessageBox("Error uploading file.");
            });
        } catch (parseError) {
            console.error('Error parsing GeoJSON:', parseError);
            showMessageBox("Error: Invalid GeoJSON file.");
        }
    };
    reader.readAsText(file);
}

// Prevent the page from refreshing on file upload
document.getElementById('file-upload').addEventListener('change', function(event) {
    event.preventDefault();
    handleFileUpload(event);
});

// Function to get the date for each day
function getDateForDay(day) {
    var date = new Date();
    date.setDate(date.getDate() + (day - 1));
    return date.toISOString().split('T')[0];
}

// Function to get covered districts
function getCoveredDistricts(polygonGeoJSON) {
    var coveredDistricts = [];
    
    if (districtsGeoJSON && polygonGeoJSON) {
        districtsGeoJSON.features.forEach(function(district) {
            var districtGeoJSON = {
                type: "Feature",
                geometry: district.geometry,
                properties: district.properties
            };
            var intersection = turf.intersect(polygonGeoJSON, districtGeoJSON);
            if (intersection) {
                coveredDistricts.push(district.properties.name); // Adjust this line as necessary
            }
        });
    }
    
    return coveredDistricts;
}

// Function to convert all drawn features to GeoJSON and download, including intersections
function downloadAllGeoJSON() {
    var allFeatures = [];
    var intersectionFeatures = [];

    // First: sync form values into layers
    document.querySelectorAll('#forms-container .polygon-form').forEach(form => {
        var formId = form.dataset.formId;
        let layer = null;

        if (formId.startsWith('polygon-')) {
            var layerId = parseInt(formId.split('-')[1]);
            for (var day in layersByDay) {
                layer = layersByDay[day].getLayer(layerId);
                if (layer) break;
            }
        } else if (formId.startsWith('intersection-')) {
            var intersectionId = parseInt(formId.split('-')[1]);
            const intersectionData = allIntersections[activeTab]?.find(i => i.id === intersectionId);
            if (intersectionData) {
                layer = intersectionData.polygon;
            }
        }

        if (layer) {
            // Get values from the form
            const warning = document.getElementById(`warning-${formId}`).value;
            const color = document.getElementById(`color-${formId}`).value;
            const date = document.getElementById(`date-${formId}`).value;

            // Correctly get selected values from custom dropdowns
            const expectedDropdown = document.querySelector(`#expected-${formId} .dropdown-menu`);
            const expected = Array.from(expectedDropdown.querySelectorAll('input[type="checkbox"]:checked'))
                                .filter(cb => cb.value !== 'select-all') // Exclude the 'select-all' checkbox value
                                .map(cb => cb.value);

            const safetyDropdown = document.querySelector(`#safety-${formId} .dropdown-menu`);
            const safety = Array.from(safetyDropdown.querySelectorAll('input[type="checkbox"]:checked'))
                                .filter(cb => cb.value !== 'select-all') // Exclude the 'select-all' checkbox value
                                .map(cb => cb.value);

            layer.feature.properties.Warning = warning;
            layer.feature.properties.Color = color;
            layer.feature.properties.Date = date;
            layer.feature.properties.ExpectedImpacts = expected; // Store as array
            layer.feature.properties.SafetyMeasures = safety;   // Store as array
        }
    });

    // Now collect all layers from all days
    for (var day in layersByDay) {
        layersByDay[day].eachLayer(function(layer) {
            if (layer.toGeoJSON) {
                allFeatures.push(layer.toGeoJSON());
            }
        });
    }

    // Process intersections
    for (var i = 0; i < allFeatures.length; i++) {
        for (var j = i + 1; j < allFeatures.length; j++) {
            try {
                var intersection = turf.intersect(allFeatures[i], allFeatures[j]);
                if (intersection) {
                    var combinedWarnings = new Set([
                        allFeatures[i].properties.Warning,
                        allFeatures[j].properties.Warning
                    ].filter(Boolean));

                    var combinedImpacts = new Set([
                        ...(allFeatures[i].properties.ExpectedImpacts || []),
                        ...(allFeatures[j].properties.ExpectedImpacts || [])
                    ].filter(Boolean));

                    var combinedSafetyMeasures = new Set([
                        ...(allFeatures[i].properties.SafetyMeasures || []),
                        ...(allFeatures[j].properties.SafetyMeasures || [])
                    ].filter(Boolean));

                    intersection.properties = {
                        combinedWarnings: Array.from(combinedWarnings).join(', '),
                        ExpectedImpacts: Array.from(combinedImpacts),
                        SafetyMeasures: Array.from(combinedSafetyMeasures)
                    };

                    intersectionFeatures.push(intersection);
                }
            } catch (error) {
                console.error('Error processing intersection:', error);
            }
        }
    }

    var allGeoJSON = {
        type: "FeatureCollection",
        features: allFeatures.concat(intersectionFeatures)
    };

    allGeoJSON.features.forEach(function(feature) {
        try {
            feature.properties.coveredDistricts = getCoveredDistricts(feature);
        } catch (error) {
            console.error('Error getting covered districts:', error);
        }
    });

    allGeoJSON.crs = {
        type: "name",
        properties: {
            name: "urn:ogc:def:crs:EPSG::4326"
        }
    };

    var prettyData = JSON.stringify(allGeoJSON, null, 2);
    var blob = new Blob([prettyData], { type: "application/json" });
    var url = URL.createObjectURL(blob);

    var a = document.createElement("a");
    a.href = url;
    a.download = `${getDateForDay(activeTab)}_all_polygons_with_intersections.geojson`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function createForm(layer, showAttributes = true) {
    if (!showAttributes) return;

    const isIntersection = layer.feature?.properties?.isIntersection;
    const formId = isIntersection
        ? `intersection-${layer.feature.properties.intersectionId}`
        : `polygon-${layer._leaflet_id}`; // Use Leaflet ID as base for form ID

    const existingForm = document.querySelector(`[data-form-id="${formId}"]`);
    if (existingForm) existingForm.remove();

    const form = document.createElement('div');
    form.className = 'polygon-form';
    form.dataset.day = activeTab;
    form.dataset.formId = formId;

    // Use the sequential number for the title
    const title = isIntersection
        ? `Intersection ${layer.feature.properties.intersectionNumber}`
        : `Polygon ${layer.feature.properties.polygonNumber}`;

    const allWarnings = Array.from(allWarningsSet).sort();

    const optionsHtml = allWarnings.map(w => `
        <option value="${w}" ${layer.feature.properties.Warning === w ? 'selected' : ''}>${w}</option>
    `).join('');

    const colorOptions = ['Yellow', 'Orange', 'Red', 'Purple'];
    const defaultColor = isIntersection ? 'Purple' : (layer.feature.properties.Color || 'Yellow');
    const colorOptionsHtml = colorOptions.map(c => `
        <option value="${c}" ${c === defaultColor ? 'selected' : ''}>${c}</option>
    `).join('');

    // Get existing impacts and safety measures for pre-selection
    const existingImpacts = layer.feature.properties.ExpectedImpacts || [];
    const existingSafetyMeasures = layer.feature.properties.SafetyMeasures || [];

    form.innerHTML = `
        <h3>${title}</h3>
        <div class="form-group">
            <label for="warning-${formId}">Warnings</label>
            <select id="warning-${formId}">
                <option value="" disabled selected>Select a warning</option>
                ${optionsHtml}
            </select>
        </div>

        <div id="info-${formId}" style="margin-top:10px; font-size:13px; color:#333;"></div>

        <div class="form-group">
            <label for="color-${formId}">Color</label>
            <select id="color-${formId}">
                ${colorOptionsHtml}
            </select>
        </div>

        <div class="form-group">
            <label>Expected Impacts</label>
            <div id="expected-${formId}" class="custom-dropdown"></div>
        </div>

        <div class="form-group">
            <label>Safety Measures</label>
            <div id="safety-${formId}" class="custom-dropdown"></div>
        </div>

        <div class="form-group">
            <label for="date-${formId}">Date</label>
            <input type="text" id="date-${formId}" value="${layer.feature.properties.Date || getDateForDay(activeTab)}" readonly>
        </div>

        <button class="btn" onclick="updateAttributes('${layer._leaflet_id}', '${formId}')">Update Attributes</button>
        <button class="btn" onclick="downloadPolygonGeoJSON('${formId}')">Download GeoJSON</button>
    `;

    document.getElementById('forms-container').appendChild(form);

    const warningSelect = form.querySelector(`#warning-${formId}`);
    const infoDiv = form.querySelector(`#info-${formId}`);
    const expectedDiv = form.querySelector(`#expected-${formId}`);
    const safetyDiv = form.querySelector(`#safety-${formId}`);

    // Populate custom dropdowns initially
    const initialWarning = warningSelect.value;
    const impacts = warningImpacts[initialWarning] || [];
    const safety = warningSafetyMeasures[initialWarning] || [];

    populateCustomDropdown(expectedDiv, impacts, `expected-${formId}`, existingImpacts);
    populateCustomDropdown(safetyDiv, safety, `safety-${formId}`, existingSafetyMeasures);

    // Update info div if a warning is already selected
    if (initialWarning) {
        infoDiv.innerHTML = `
            <strong>Impacts:</strong> ${impacts.join(', ')}<br>
            <strong>Safety Measures:</strong> ${safety.join(', ')}
        `;
    }

    warningSelect.addEventListener('change', () => {
        const warning = warningSelect.value;

        const impactsForWarning = warningImpacts[warning] || [];
        const safetyForWarning = warningSafetyMeasures[warning] || [];

        infoDiv.innerHTML = `
            <strong>Impacts:</strong> ${impactsForWarning.join(', ')}<br>
            <strong>Safety Measures:</strong> ${safetyForWarning.join(', ')}
        `;

        // Re-populate dropdowns with new options, maintaining selected state if possible
        populateCustomDropdown(expectedDiv, impactsForWarning, `expected-${formId}`, []); // Clear previous selections
        populateCustomDropdown(safetyDiv, safetyForWarning, `safety-${formId}`, []); // Clear previous selections
    });
}

// Helper function to show a message box instead of alert()
function showMessageBox(message) {
    const messageBox = document.createElement('div');
    messageBox.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: #333;
        color: #fff;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
        z-index: 9999;
        font-family: Arial, sans-serif;
        font-size: 16px;
        text-align: center;
        opacity: 0;
        transition: opacity 0.3s ease-in-out;
    `;
    messageBox.textContent = message;
    document.body.appendChild(messageBox);

    // Fade in
    setTimeout(() => {
        messageBox.style.opacity = '1';
    }, 10);

    // Fade out and remove after 3 seconds
    setTimeout(() => {
        messageBox.style.opacity = '0';
        messageBox.addEventListener('transitionend', () => messageBox.remove());
    }, 3000);
}


function populateCustomDropdown(container, items, idPrefix, selectedItems = []) {
    container.innerHTML = '';

    const button = document.createElement('button');
    button.textContent = 'Select Items';
    button.type = 'button';
    button.classList.add('dropdown-btn');

    const menu = document.createElement('div');
    menu.classList.add('dropdown-menu');
    menu.id = idPrefix + '-menu'; // Assign an ID to the menu for easier access

    // "Select All" checkbox
    const selectAllDiv = document.createElement('div');
    selectAllDiv.classList.add('dropdown-item', 'select-all-item');
    const selectAllCb = document.createElement('input');
    selectAllCb.type = 'checkbox';
    selectAllCb.id = `${idPrefix}-select-all`;
    selectAllCb.value = 'select-all'; // Value for select-all checkbox

    const selectAllLabel = document.createElement('label');
    selectAllLabel.textContent = 'Select All';
    selectAllLabel.htmlFor = `${idPrefix}-select-all`;
    selectAllLabel.prepend(selectAllCb);
    selectAllDiv.appendChild(selectAllLabel);
    menu.appendChild(selectAllDiv);

    items.forEach(item => {
        const div = document.createElement('div');
        div.classList.add('dropdown-item');

        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.value = item;
        cb.id = `${idPrefix}-${item.replace(/\s/g, '-')}`; // Unique ID for each checkbox
        cb.checked = selectedItems.includes(item); // Pre-check if in selectedItems

        const label = document.createElement('label');
        label.textContent = item;
        label.htmlFor = cb.id; // Link label to checkbox
        label.prepend(cb);

        div.appendChild(label);
        menu.appendChild(div);
    });

    container.appendChild(button);
    container.appendChild(menu);

    // Event listener for "Select All"
    selectAllCb.addEventListener('change', function() {
        const checkboxes = menu.querySelectorAll('input[type="checkbox"]:not(#select-all)');
        checkboxes.forEach(cb => {
            cb.checked = this.checked;
        });
    });

    // Event listener for individual checkboxes to uncheck "Select All" if not all are selected
    menu.querySelectorAll('input[type="checkbox"]:not(#select-all)').forEach(cb => {
        cb.addEventListener('change', () => {
            const allChecked = Array.from(menu.querySelectorAll('input[type="checkbox"]:not(#select-all)'))
                                  .every(c => c.checked);
            selectAllCb.checked = allChecked;
        });
    });

    button.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent document click from closing immediately
        menu.classList.toggle('show');
    });

    document.addEventListener('click', (e) => {
        if (!container.contains(e.target)) {
            menu.classList.remove('show');
        }
    });
}


// Function to update the attributes of the specified layer
function updateAttributes(layerId, formId) {
    let layer = null;
    for (const day in layersByDay) {
        layer = layersByDay[day].getLayer(layerId);
        if (layer) break;
    }

    if (layer) {
        const warning = document.getElementById(`warning-${formId}`).value;
        const color = document.getElementById(`color-${formId}`).value;
        const date = document.getElementById(`date-${formId}`).value;

        // Get selected values from custom dropdowns
        const expectedDropdown = document.querySelector(`#expected-${formId} .dropdown-menu`);
        const expected = Array.from(expectedDropdown.querySelectorAll('input[type="checkbox"]:checked'))
            .filter(cb => cb.value !== 'select-all') // Exclude the 'select-all' checkbox value
            .map(opt => opt.value);

        const safetyDropdown = document.querySelector(`#safety-${formId} .dropdown-menu`);
        const safety = Array.from(safetyDropdown.querySelectorAll('input[type="checkbox"]:checked'))
            .filter(cb => cb.value !== 'select-all') // Exclude the 'select-all' checkbox value
            .map(opt => opt.value);

        layer.feature.properties.Warning = warning;
        layer.feature.properties.Color = color;
        layer.feature.properties.Date = date;
        layer.feature.properties.ExpectedImpacts = expected;
        layer.feature.properties.SafetyMeasures = safety;

        layer.setStyle({ color });

        if (layer.warningMarker) {
            layersByDay[activeTab].removeLayer(layer.warningMarker);
        }

        if (warningIcons[warning]) {
            const latLng = layer.getBounds().getCenter();
            layer.warningMarker = L.marker(latLng, { icon: warningIcons[warning] });
            layersByDay[activeTab].addLayer(layer.warningMarker);
        }

        updateIntersectionIcons();
        showMessageBox('Attributes updated successfully.');
    } else {
        console.error('Layer not found:', layerId);
        showMessageBox('Error: Layer not found.');
    }
}


function collectLayers(activeDayLayers) {
    var layers = [];
    activeDayLayers.eachLayer(function(layer) {
        layers.push(layer);
    });
    return layers;
}

function removeExistingMarkers(map) {
    if (map.intersectionLayer) {
        map.removeLayer(map.intersectionLayer);
    }
}

function createSmallIcons(warningIcons) {
    var smallIcons = {};
    for (var key in warningIcons) {
        smallIcons[key] = L.icon({
            iconUrl: warningIcons[key].options.iconUrl,
            iconSize: [84, 84] // Adjust size as needed
        });
    }
    return smallIcons;
}

function createCombinedIconHtml(icon1Url, icon2Url) {
    return `
        <div style="position: relative; width: 24px; height: 24px;">
            <img src="${icon1Url}" style="position: absolute; width: 24px; height: 24px;"/>
            <img src="${icon2Url}" style="position: absolute; width: 24px; height: 24px; clip: rect(0, 12px, 24px, 0);"/>
        </div>
    `;
}

function addIconToIntersection(center, icon1Url, icon2Url, intersectionLayer) {
    var markers = [];
    if (icon1Url && icon2Url) {
        var combinedIconHtml = createCombinedIconHtml(icon1Url, icon2Url);
        var combinedIcon = L.divIcon({
            className: '',
            html: combinedIconHtml,
            iconSize: [24, 24]
        });
        markers.push(L.marker(center, { icon: combinedIcon }).addTo(map));
    } else if (icon1Url) {
        markers.push(L.marker(center, { icon: L.icon({ iconUrl: icon1Url, iconSize: [24, 24] }) }).addTo(map));
    } else if (icon2Url) {
        markers.push(L.marker(center, { icon: L.icon({ iconUrl: icon2Url, iconSize: [24, 24] }) }).addTo(map));
    }
    return markers;
}


function processIntersections(layers, smallIcons, intersectionLayer) {
    var intersectionCount = 0;
    for (var i = 0; i < layers.length; i++) {
        for (var j = i + 1; j < layers.length; j++) {
            var poly1 = layers[i].toGeoJSON();
            var poly2 = layers[j].toGeoJSON();
            var intersection = turf.intersect(poly1, poly2);

            if (intersection) {
                intersectionCount++;
                var latLngs = intersection.geometry.coordinates[0].map(coord => [coord[1], coord[0]]);
                var intersectionPolygon = L.polygon(latLngs, {
                    color: 'purple',
                    weight: 2,
                    fillOpacity: 0.3
                }).addTo(intersectionLayer);

                // Combine properties from both polygons
                intersectionPolygon.feature = {
                    type: 'Feature',
                    properties: {
                        isIntersection: true,
                        intersectionId: intersectionCount,
                        Warning: [poly1.properties.Warning, poly2.properties.Warning].filter(Boolean).join(', '),
                        Color: 'Purple',
                        Date: poly1.properties.Date || poly2.properties.Date,
                        ExpectedImpacts: [...(poly1.properties.ExpectedImpacts || []), ...(poly2.properties.ExpectedImpacts || [])].filter((value, index, self) => self.indexOf(value) === index),
                        SafetyMeasures: [...(poly1.properties.SafetyMeasures || []), ...(poly2.properties.SafetyMeasures || [])].filter((value, index, self) => self.indexOf(value) === index)
                    },
                    geometry: intersection.geometry
                };

                var centroid = turf.centroid(intersectionPolygon.toGeoJSON()).geometry.coordinates;
                var center = [centroid[1], centroid[0]];

                var icon1Url = poly1.properties.Warning ? warningIcons[poly1.properties.Warning].options.iconUrl : null;
                var icon2Url = poly2.properties.Warning ? warningIcons[poly2.properties.Warning].options.iconUrl : null;

                addIconToIntersection(center, icon1Url, icon2Url, intersectionLayer);

                // Create form for intersection
                createForm(intersectionPolygon, true);
            }
        }
    }
}

function updateIntersectionIcons() {
    var layers = collectLayers(layersByDay[activeTab]);
    
    // Clear existing intersections for the active day
    if (allIntersections[activeTab]) {
        allIntersections[activeTab].forEach(intersection => {
            map.removeLayer(intersection.polygon);
            if (intersection.warningMarkers) {
                intersection.warningMarkers.forEach(marker => map.removeLayer(marker));
            }
        });
    }
    allIntersections[activeTab] = [];

    var intersectionCount = 0;

    for (var i = 0; i < layers.length; i++) {
        for (var j = i + 1; j < layers.length; j++) {
            var poly1 = layers[i].toGeoJSON();
            var poly2 = layers[j].toGeoJSON();
            var intersection = turf.intersect(poly1, poly2);

            if (intersection) {
                intersectionCount++;
                var latLngs = intersection.geometry.coordinates[0].map(coord => [coord[1], coord[0]]);
                var intersectionPolygon = L.polygon(latLngs, {
                    color: 'purple',
                    weight: 2,
                    fillOpacity: 0.3
                }).addTo(map);

                var intersectionData = {
                    id: intersectionCount,
                    warning: [poly1.properties.Warning, poly2.properties.Warning].filter(Boolean).join(', '),
                    color: 'Purple',
                    date: poly1.properties.Date || poly2.properties.Date,
                    expectedImpacts: [...(poly1.properties.ExpectedImpacts || []), ...(poly2.properties.ExpectedImpacts || [])].filter((value, index, self) => self.indexOf(value) === index),
                    safetyMeasures: [...(poly1.properties.SafetyMeasures || []), ...(poly2.properties.SafetyMeasures || [])].filter((value, index, self) => self.indexOf(value) === index),
                    polygon: intersectionPolygon
                };

                intersectionPolygon.feature = {
                    type: 'Feature',
                    properties: {
                        isIntersection: true,
                        intersectionId: intersectionCount,
                        Warning: intersectionData.warning,
                        Color: intersectionData.color,
                        Date: intersectionData.date,
                        ExpectedImpacts: intersectionData.expectedImpacts,
                        SafetyMeasures: intersectionData.safetyMeasures
                    },
                    geometry: intersection.geometry
                };

                var centroid = turf.centroid(intersectionPolygon.toGeoJSON()).geometry.coordinates;
                var center = [centroid[1], centroid[0]];

                var icon1Url = poly1.properties.Warning ? warningIcons[poly1.properties.Warning].options.iconUrl : null;
                var icon2Url = poly2.properties.Warning ? warningIcons[poly2.properties.Warning].options.iconUrl : null;

                var warningMarkers = addIconToIntersection(center, icon1Url, icon2Url, intersectionPolygon);

                allIntersections[activeTab].push({
                    id: intersectionCount,
                    warning: intersectionData.warning,
                    color: intersectionData.color,
                    date: intersectionData.date,
                    polygon: intersectionPolygon,
                    warningMarkers: warningMarkers,
                    expectedImpacts: intersectionData.expectedImpacts,
                    safetyMeasures: intersectionData.safetyMeasures
                });

                // Update or create form for intersection
                updateOrCreateIntersectionForm(intersectionPolygon);
            }
        }
    }

    // Remove forms for intersections that no longer exist
    removeObsoleteIntersectionForms(intersectionCount);

    showTab(activeTab); // Refresh the current tab view
}


function updateWarningIcons(day) {
    layersByDay[day].eachLayer(function(layer) {
        if (layer.feature && layer.feature.properties && layer.feature.properties.Warning) {
            var warning = layer.feature.properties.Warning;
            if (warningIcons[warning]) {
                // Remove existing warning marker if any
                if (layer.warningMarker) {
                    layersByDay[day].removeLayer(layer.warningMarker);
                }
                var latLng = layer.getBounds().getCenter();
                layer.warningMarker = L.marker(latLng, { icon: warningIcons[warning] });
                layersByDay[day].addLayer(layer.warningMarker);
            }
        }
    });
}


function updateIntersectionColor(formId) {
    var intersectionId = parseInt(formId.split('-')[1]);
    var newColor = document.getElementById(`color-${formId}`).value;
    
    for (var day in intersectionsByDay) {
        intersectionsByDay[day].eachLayer(function(layer) {
            if (layer.feature && layer.feature.properties && layer.feature.properties.intersectionId === intersectionId) {
                layer.setStyle({ color: newColor });
                layer.feature.properties.Color = newColor;
            }
        });
    }
}


function updateOrCreateIntersectionForm(intersectionPolygon) {
    var formId = `intersection-${intersectionPolygon.feature.properties.intersectionId}`;
    var existingForm = document.querySelector(`[data-form-id="${formId}"]`);
    
    if (existingForm) {
        // Update existing form
        updateIntersectionForm(existingForm, intersectionPolygon);
    } else {
        // Create new form
        createForm(intersectionPolygon, true);
    }
}

function updateIntersectionForm(form, intersectionPolygon) {
    var props = intersectionPolygon.feature.properties;
    form.querySelector('h3').textContent = `Intersection ${props.intersectionNumber}`; // Use sequential number
    var warningSelect = form.querySelector('[id^="warning-"]');
    if (warningSelect) warningSelect.value = props.Warning;
    form.querySelector('[id^="color-"]').value = props.Color;
    var dateInput = form.querySelector('[id^="date-"]');
    if (dateInput) dateInput.value = props.Date;

    // Update custom dropdowns for impacts and safety measures
    const expectedDiv = form.querySelector('[id^="expected-"]');
    const safetyDiv = form.querySelector('[id^="safety-"]');

    // Get current selected items from the intersection polygon's properties
    const currentImpacts = props.ExpectedImpacts || [];
    const currentSafetyMeasures = props.SafetyMeasures || [];

    // Re-populate and pre-select items in dropdowns
    const warning = warningSelect.value;
    const impactsForWarning = warningImpacts[warning] || [];
    const safetyForWarning = warningSafetyMeasures[warning] || [];

    populateCustomDropdown(expectedDiv, impactsForWarning, expectedDiv.id, currentImpacts);
    populateCustomDropdown(safetyDiv, safetyForWarning, safetyDiv.id, currentSafetyMeasures);
}

function removeObsoleteIntersectionForms(currentIntersectionCount) {
    var forms = document.querySelectorAll('#forms-container [data-form-id^="intersection-"]');
    forms.forEach(form => {
        var formId = parseInt(form.dataset.formId.split('-')[1]);
        if (formId > currentIntersectionCount) {
            form.remove();
        }
    });
}


function updateIntersectionAttributes(formId) {
    var intersectionId = parseInt(formId.split('-')[1]);
    var newColor = document.getElementById(`color-${formId}`).value;
    
    var intersectionData = allIntersections[activeTab].find(i => i.id === intersectionId);

    if (intersectionData) {
        // Update color
        intersectionData.polygon.setStyle({ color: newColor });
        intersectionData.polygon.feature.properties.Color = newColor;
        intersectionData.color = newColor;

        // Get selected values from custom dropdowns for intersection
        const expectedDropdown = document.querySelector(`#expected-${formId} .dropdown-menu`);
        const expected = Array.from(expectedDropdown.querySelectorAll('input[type="checkbox"]:checked'))
            .filter(cb => cb.value !== 'select-all')
            .map(opt => opt.value);

        const safetyDropdown = document.querySelector(`#safety-${formId} .dropdown-menu`);
        const safety = Array.from(safetyDropdown.querySelectorAll('input[type="checkbox"]:checked'))
            .filter(cb => cb.value !== 'select-all')
            .map(opt => opt.value);

        intersectionData.expectedImpacts = expected;
        intersectionData.safetyMeasures = safety;
        intersectionData.polygon.feature.properties.ExpectedImpacts = expected;
        intersectionData.polygon.feature.properties.SafetyMeasures = safety;

        // Update warning icons if needed (assuming warning doesn't change for intersection)
        var warnings = intersectionData.warning.split(', ');
        var center = intersectionData.polygon.getBounds().getCenter();
        
        // Remove existing warning markers
        if (intersectionData.warningMarkers) {
            intersectionData.warningMarkers.forEach(marker => {
                map.removeLayer(marker);
            });
        }

        // Add new warning markers
        intersectionData.warningMarkers = warnings.map(warning => {
            if (warningIcons[warning]) {
                var marker = L.marker(center, { icon: warningIcons[warning] });
                map.addLayer(marker);
                return marker;
            }
        }).filter(Boolean);

        showMessageBox('Intersection attributes updated successfully.');
    } else {
        console.error('Intersection data not found:', intersectionId);
        showMessageBox('Error: Intersection data not found.');
    }
}
// Function to get the date for each day
function getDateForDay(day) {
    var date = new Date();
    date.setDate(date.getDate() + (day - 1));
    return date.toISOString().split('T')[0];
}

// Function to download the GeoJSON of the specified polygon
function downloadPolygonGeoJSON(formId) {
    var layer;
    if (formId.startsWith('polygon-')) {
        // It's a regular polygon
        var layerId = parseInt(formId.split('-')[1]);
        for (var day in layersByDay) {
            layer = layersByDay[day].getLayer(layerId);
            if (layer) break;
        }
    } else if (formId.startsWith('intersection-')) {
        // It's an intersection
        var intersectionId = parseInt(formId.split('-')[1]);
        const intersectionData = allIntersections[activeTab]?.find(i => i.id === intersectionId);
        if (intersectionData) {
            layer = intersectionData.polygon;
        }
    }

    if (layer) {
        // Ensure properties are up-to-date before downloading
        // This is important if attributes were updated but not yet synced to the layer's feature.properties
        const form = document.querySelector(`[data-form-id="${formId}"]`);
        if (form) {
            const warning = document.getElementById(`warning-${formId}`).value;
            const color = document.getElementById(`color-${formId}`).value;
            const date = document.getElementById(`date-${formId}`).value;

            const expectedDropdown = document.querySelector(`#expected-${formId} .dropdown-menu`);
            const expected = Array.from(expectedDropdown.querySelectorAll('input[type="checkbox"]:checked'))
                                .filter(cb => cb.value !== 'select-all')
                                .map(opt => opt.value);

            const safetyDropdown = document.querySelector(`#safety-${formId} .dropdown-menu`);
            const safety = Array.from(safetyDropdown.querySelectorAll('input[type="checkbox"]:checked'))
                                .filter(cb => cb.value !== 'select-all')
                                .map(opt => opt.value);

            layer.feature.properties.Warning = warning;
            layer.feature.properties.Color = color;
            layer.feature.properties.Date = date;
            layer.feature.properties.ExpectedImpacts = expected;
            layer.feature.properties.SafetyMeasures = safety;
        }


        var data = layer.toGeoJSON();

        // Add CRS property to the GeoJSON
        data.crs = {
            type: "name",
            properties: {
                name: "urn:ogc:def:crs:EPSG::4326" // WGS84 coordinate system
            }
        };

        // Add district information
        if (typeof getCoveredDistricts === 'function') {
            data.properties.coveredDistricts = getCoveredDistricts(data);
        }

        var prettyData = JSON.stringify(data, null, 2);

        var blob = new Blob([prettyData], {type: "application/json"});
        var url = URL.createObjectURL(blob);

        var a = document.createElement("a");
        a.href = url;
        a.download = `${formId}.geojson`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } else {
        console.error('Layer not found:', formId);
        showMessageBox('Error: Layer not found. Cannot download GeoJSON.');
    }
}


// Function to handle tab switching
var activeTab = 1;


// Function to handle tab switching
function showTab(day) {
    // Hide all layers and forms
    for (var key in layersByDay) {
        map.removeLayer(layersByDay[key]);
        if (allIntersections[key]) {
            allIntersections[key].forEach(intersection => {
                map.removeLayer(intersection.polygon);
                if (intersection.warningMarkers) {
                    intersection.warningMarkers.forEach(marker => map.removeLayer(marker));
                }
            });
        }
    }
    
    // Show the layers for the selected day
    map.addLayer(layersByDay[day]);
    
    // Show intersections for the selected day
    if (allIntersections[day]) {
        allIntersections[day].forEach(intersection => {
            map.addLayer(intersection.polygon);
            if (intersection.warningMarkers) {
                intersection.warningMarkers.forEach(marker => map.addLayer(marker));
            }
        });
    }
    
    activeTab = day;
    
    // Update the UI to reflect the active tab
    updateTabUI(day);
    
    // Update the forms to reflect the active day's polygons and intersections
    updateFormsForActiveDay();

    // Update warning icons for the active day
    updateWarningIcons(day);
}


function recreateIntersectionForms(day) {
    intersectionsByDay[day].data.forEach(intersectionData => {
        createForm(intersectionData.polygon, true);
    });
}

function updateTabUI(day) {
    // Add logic to highlight the active tab in the UI
    var tabs = document.querySelectorAll('.tab'); // Changed from .day-tab to .tab as per index.html
    tabs.forEach(tab => {
        if (parseInt(tab.textContent.replace('Day ', '')) === day) { // Parse day from text content
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
}

function updateFormsForActiveDay() {
    // Clear existing forms
    formsContainer.innerHTML = '';

    // Assign sequential numbers to polygons for the active day
    let polygonNumber = 1;
    layersByDay[activeTab].eachLayer(function(layer) {
        if (layer.feature && layer.feature.properties) {
            layer.feature.properties.polygonNumber = polygonNumber++;
        }
        createForm(layer, true);
    });

    // Assign sequential numbers to intersections for the active day
    let intersectionNumber = 1;
    if (allIntersections[activeTab]) {
        allIntersections[activeTab].forEach(intersectionData => {
            if (intersectionData.polygon.feature && intersectionData.polygon.feature.properties) {
                intersectionData.polygon.feature.properties.intersectionNumber = intersectionNumber++;
            }
            createForm(intersectionData.polygon, true);
        });
    }

    // Ensure all forms are visible for the active tab (though they are already created for the active tab)
    var allForms = formsContainer.querySelectorAll('.polygon-form');
    allForms.forEach(form => {
        if (form.dataset.day == activeTab) {
            form.style.display = 'block';
        } else {
            form.style.display = 'none'; // This case should ideally not happen if forms are cleared and recreated
        }
    });
}


// Example usage: Add event listeners to tabs (assuming you have elements with class "day-tab")
document.querySelectorAll('.tab').forEach(tab => { // Changed from .day-tab to .tab
    tab.addEventListener('click', function() {
        var day = parseInt(this.textContent.replace('Day ', '')); // Parse day from text content
        showTab(day);
    });
});

var districtsGeoJSON = null;

fetch('static/districts_india.geojson')
    .then(response => response.json())
    .then(data => {
        districtsGeoJSON = data;
    })
    .catch(error => {
        console.error('Error loading districts GeoJSON:', error);
    });
