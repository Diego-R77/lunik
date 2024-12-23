// Configuration constants
const VIEWS = [
    'front', 'front_profile1', 'side1', 'back_profile1', 'back', 
    'back_profile2', 'side2', 'front_profile2', 'front_extended'
];

const COLORS = [
    'black', 'white', 'gray', 'beige', 'red', 'olive', 
    'orange', 'yellow', 'royal blue', 'navy', 'fuchsia'
];

const COLOR_HEX_MAP = {
    'black': '#191919',
    'white': '#EFEFEF',
    'gray': '#727272',
    'beige': '#A0874E',
    'red': '#D61642',
    'olive': '#445330',
    'orange': '#DD5828',
    'yellow': '#C8DB3A',
    'royal blue': '#133683',
    'navy': '#152750',
    'fuchsia': '#95216D'
};

const COMPONENT_GROUP_1 = [
    'panel_top_left', 'panel_top_center', 'panel_top_right', 
    'panel_bottom_left', 'panel_bottom_center', 'panel_bottom_right', 
    'side_left', 'side_right', 'extension'
];

const COMPONENT_GROUP_2 = [
    'straps_top', 'straps_bottom', 'accents'
];

// Add new constant for carousel views (excluding front_extended)
const CAROUSEL_VIEWS = VIEWS.filter(view => view !== 'front_extended');

let currentViewIndex = CAROUSEL_VIEWS.indexOf('front'); // Initialize to front view index

// Initialize the product configuration
function initializeProductConfiguration() {
    const defaultConfig = {};
    
    // Set default colors for all components to red
    [...COMPONENT_GROUP_1, ...COMPONENT_GROUP_2].forEach(component => {
        defaultConfig[component] = 'red';
    });

    localStorage.setItem('product_current', JSON.stringify(defaultConfig));
    return defaultConfig;
}

// Get current product configuration
function getCurrentProduct() {
    const product = localStorage.getItem('product_current');
    return product ? JSON.parse(product) : initializeProductConfiguration();
}

// Update product configuration
function updateProductConfiguration(component, color) {
    const currentProduct = getCurrentProduct();
    currentProduct[component] = color;
    localStorage.setItem('product_current', JSON.stringify(currentProduct));
}

// Load a specific image
function loadImage(component, color, view) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const imgPath = `images/products/hbar_bag/${component}_${color}_${view}.png`;
        
        img.onload = () => resolve({ component, color, view, img });
        img.onerror = () => reject(new Error(`Failed to load image: ${imgPath}`));
        img.src = imgPath;
    });
}

// Add this new function to handle view transitions
function updateVisibleView(newIndex) {
    // Hide all views including front_extended
    VIEWS.forEach(view => {
        const viewElement = document.getElementById(`${view}-view`);
        if (viewElement) {
            viewElement.classList.add('hidden');
        }
    });

    // Show the new view
    const newView = document.getElementById(`${CAROUSEL_VIEWS[newIndex]}-view`);
    if (newView) {
        newView.classList.remove('hidden');
    }
}

// Add carousel navigation setup
function setupCarouselNavigation() {
    const prevButton = document.querySelector('.nav-arrow.left');
    const nextButton = document.querySelector('.nav-arrow.right');

    prevButton.addEventListener('click', () => {
        currentViewIndex = (currentViewIndex - 1 + CAROUSEL_VIEWS.length) % CAROUSEL_VIEWS.length;
        updateVisibleView(currentViewIndex);
    });

    nextButton.addEventListener('click', () => {
        currentViewIndex = (currentViewIndex + 1) % CAROUSEL_VIEWS.length;
        updateVisibleView(currentViewIndex);
    });
}

// Update product views with current configuration
function updateProductViews(product) {
    const productViews = document.getElementById('product-views');
    const loadingOverlay = document.getElementById('loading-overlay');
    
    // Show loading overlay
    loadingOverlay.classList.remove('hidden');
    
    // Store existing view classes before clearing
    const existingViewClasses = {};
    VIEWS.forEach(view => {
        const existingView = document.getElementById(`${view}-view`);
        if (existingView) {
            existingViewClasses[view] = Array.from(existingView.classList)
                .filter(className => className !== 'product-view');
        }
    });
    
    productViews.innerHTML = ''; // Clear existing views

    // Keep track of all images that need to load
    const imageLoadPromises = [];

    VIEWS.forEach(view => {
        const viewContainer = document.createElement('div');
        viewContainer.id = `${view}-view`;
        viewContainer.classList.add('product-view');
        
        if (view === 'front_extended' || (view !== CAROUSEL_VIEWS[currentViewIndex])) {
            viewContainer.classList.add('hidden');
        }
        
        if (existingViewClasses[view]) {
            existingViewClasses[view].forEach(className => {
                viewContainer.classList.add(className);
            });
        }

        Object.keys(product).forEach(component => {
            const componentDiv = document.createElement('div');
            componentDiv.classList.add('product-component');
            
            const img = document.createElement('img');
            const imgPath = `images/products/hbar_bag/${component}_${product[component]}_${view}.png`;
            img.alt = `${component} in ${product[component]}`;
            
            // Create a promise for each image load
            const imageLoadPromise = new Promise((resolve) => {
                img.onload = () => {
                    resolve();
                };
                img.onerror = () => {
                    console.error(`Failed to load image: ${imgPath}`);
                    componentDiv.classList.add('image-error');
                    // Still resolve the promise even if image fails to load
                    resolve();
                };
            });
            
            // Add promise to array before setting src
            imageLoadPromises.push(imageLoadPromise);
            
            // Set src after creating promise
            img.src = imgPath;
            componentDiv.appendChild(img);
            viewContainer.appendChild(componentDiv);
        });

        productViews.appendChild(viewContainer);
    });

    if (imageLoadPromises.length > 0) {
        // Hide loading overlay once all images have loaded or failed
        Promise.all(imageLoadPromises)
            .then(() => {
                loadingOverlay.classList.add('hidden');
            })
            .catch(() => {
                loadingOverlay.classList.add('hidden');
            });
    } else {
        // If no images to load, hide overlay immediately
        loadingOverlay.classList.add('hidden');
    }
}

// Setup color swatch functionality
function setupColorSwatches() {
    const colorSwatch1 = document.getElementById('color-swatch-1');
    const colorSwatch2 = document.getElementById('color-swatch-2');
    const componentDropdown1 = document.getElementById('component-dropdown-1');
    const componentDropdown2 = document.getElementById('component-dropdown-2');
    const colorLabel1 = document.getElementById('color-label-1');
    const colorLabel2 = document.getElementById('color-label-2');

    // Color swatch 1 setup
    colorSwatch1.addEventListener('click', (e) => {
        if (e.target.dataset.color) {
            const selectedComponent = componentDropdown1.value;
            const selectedColor = e.target.dataset.color;

            // Update color swatch highlight
            Array.from(colorSwatch1.children).forEach(el => {
                el.classList.remove('selected');
            });
            e.target.classList.add('selected');

            // Update color label
            colorLabel1.textContent = selectedColor;

            // Update product configuration
            updateProductConfiguration(selectedComponent, selectedColor);
            
            // Update views (loading overlay is handled inside updateProductViews)
            const currentProduct = getCurrentProduct();
            updateProductViews(currentProduct);
        }
    });

    // Color swatch 2 setup
    colorSwatch2.addEventListener('click', (e) => {
        if (e.target.dataset.color) {
            const selectedComponent = componentDropdown2.value;
            const selectedColor = e.target.dataset.color;

            // Update color swatch highlight
            Array.from(colorSwatch2.children).forEach(el => {
                el.classList.remove('selected');
            });
            e.target.classList.add('selected');

            // Update color label
            colorLabel2.textContent = selectedColor;

            // Update product configuration
            updateProductConfiguration(selectedComponent, selectedColor);
            
            // Update views (loading overlay is handled inside updateProductViews)
            const currentProduct = getCurrentProduct();
            updateProductViews(currentProduct);
        }
    });

    // Dropdown change events
    componentDropdown1.addEventListener('change', (e) => {
        const currentColor = getCurrentProduct()[e.target.value];
        colorLabel1.textContent = currentColor;
        
        // Highlight corresponding swatch
        Array.from(colorSwatch1.children).forEach(el => {
            el.classList.remove('selected');
            if (el.dataset.color === currentColor) {
                el.classList.add('selected');
            }
        });
    });

    componentDropdown2.addEventListener('change', (e) => {
        const currentColor = getCurrentProduct()[e.target.value];
        colorLabel2.textContent = currentColor;
        
        // Highlight corresponding swatch
        Array.from(colorSwatch2.children).forEach(el => {
            el.classList.remove('selected');
            if (el.dataset.color === currentColor) {
                el.classList.add('selected');
            }
        });
    });
}

// Save current configuration
function saveConfiguration() {
    const currentProduct = getCurrentProduct();
    const savedConfigs = JSON.parse(localStorage.getItem('saved_configurations') || '[]');
    
    // Create a unique key for the saved configuration
    const newConfigKey = `product_current_saved_${savedConfigs.length + 1}`;
    
    // Store the configuration
    localStorage.setItem(newConfigKey, JSON.stringify(currentProduct));
    
    // Update saved configurations list
    savedConfigs.push(newConfigKey);
    localStorage.setItem('saved_configurations', JSON.stringify(savedConfigs));
    
    // Create thumbnail
    createConfigurationThumbnail(newConfigKey, currentProduct);
}

// Create thumbnail for saved configuration
function createConfigurationThumbnail(configKey, product) {
    const savedConfigsContainer = document.getElementById('saved-configurations');
    
    // Create SVG thumbnail
    const thumbnailSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    thumbnailSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    thumbnailSvg.setAttribute('width', '56');
    thumbnailSvg.setAttribute('height', '38');
    thumbnailSvg.setAttribute('viewBox', '0 0 56 38');
    thumbnailSvg.classList.add('saved-config-thumbnail');
    
    // SVG group
    const svgGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    
    // Define SVG components
    const svgComponents = [
        { class: 'panel_top_left', path: 'M5,0H16a0,0,0,0,1,0,0V23a0,0,0,0,1,0,0H7a7,7,0,0,1-7-7V5A5,5,0,0,1,5,0Z', transform: 'translate(1 2)' },
        { class: 'panel_top_center', x: 18, y: 2, width: 20, height: 23 },
        { class: 'panel_top_right', path: 'M0,0H11a5,5,0,0,1,5,5V16a7,7,0,0,1-7,7H0a0,0,0,0,1,0,0V0A0,0,0,0,1,0,0Z', transform: 'translate(39 2)' },
        { class: 'panel_bottom_left', path: 'M5,15.128a5,5,0,0,1-5-5V0A8.054,8.054,0,0,0,1.287,1.722a7.951,7.951,0,0,0,5.533,2.4l9.18,0v11Z', transform: 'translate(1 22)' },
        { class: 'panel_bottom_center', x: 18, y: 26, width: 20, height: 11 },
        { class: 'panel_bottom_right', path: 'M0,15.128v-11l9.18,0a7.951,7.951,0,0,0,5.533-2.4A8.054,8.054,0,0,0,16,0V10.128a5,5,0,0,1-5,5Z', transform: 'translate(39 22)' },
        { class: 'straps_top', path: 'M37,24V0h5V24ZM0,24V0H5V24Z', transform: 'translate(7 2)' },
        { class: 'straps_bottom', path: 'M37,11V0h5V11ZM0,11V0H5V11Z', transform: 'translate(7 26)' },
        { class: 'accents', path: 'M2,0H18a2,2,0,0,1,2,2V2a0,0,0,0,1,0,0H0A0,0,0,0,1,0,2V2A2,2,0,0,1,2,0Z', transform: 'translate(18)' }
    ];
    
    // Create SVG components
    svgComponents.forEach(comp => {
        let element;
        if (comp.path) {
            // For path-based components
            element = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            element.setAttribute('d', comp.path);
            element.setAttribute('transform', comp.transform);
        } else {
            // For rect-based components
            element = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            element.setAttribute('x', comp.x);
            element.setAttribute('y', comp.y);
            element.setAttribute('width', comp.width);
            element.setAttribute('height', comp.height);
        }
        
        element.classList.add(comp.class);
        
        // Convert color name to hex value
        const colorName = product[comp.class];
        const hexColor = COLOR_HEX_MAP[colorName] || '#d1d1d1'; // Fallback to #d1d1d1 if color not found
        element.setAttribute('fill', hexColor);
        
        svgGroup.appendChild(element);
    });
    
    thumbnailSvg.appendChild(svgGroup);
    
    // Delete icon
    const deleteIcon = document.createElement('div');
    deleteIcon.textContent = '✕';
    deleteIcon.classList.add('delete-config');
    
    // Create container for SVG and delete icon
    const thumbnailContainer = document.createElement('div');
    thumbnailContainer.classList.add('saved-config-thumbnail');
    thumbnailContainer.appendChild(thumbnailSvg);
    thumbnailContainer.appendChild(deleteIcon);
    
    // Add click event to load configuration
    thumbnailSvg.addEventListener('click', () => {
        const savedProduct = JSON.parse(localStorage.getItem(configKey));
        localStorage.setItem('product_current', JSON.stringify(savedProduct));
        updateProductViews(savedProduct);
    });
    
    // Add click event to delete configuration
    deleteIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        
        // Remove from localStorage
        localStorage.removeItem(configKey);
        
        // Remove from saved configurations list
        const savedConfigs = JSON.parse(localStorage.getItem('saved_configurations') || '[]');
        const updatedConfigs = savedConfigs.filter(config => config !== configKey);
        localStorage.setItem('saved_configurations', JSON.stringify(updatedConfigs));
        
        // Remove thumbnail from DOM
        thumbnailContainer.remove();
    });
    
    savedConfigsContainer.appendChild(thumbnailContainer);
}

// Initialize the application
function initApp() {
    // Load initial product configuration
    const initialProduct = getCurrentProduct();
    updateProductViews(initialProduct);
    
    // Setup color swatches and dropdowns
    setupColorSwatches();
    
    // Setup carousel navigation
    setupCarouselNavigation();
    
    // Setup save configuration button
    const saveConfigBtn = document.getElementById('save-config-btn');
    saveConfigBtn.addEventListener('click', saveConfiguration);
    
    // Load existing saved configurations
    const savedConfigs = JSON.parse(localStorage.getItem('saved_configurations') || '[]');
    savedConfigs.forEach(configKey => {
        const savedProduct = JSON.parse(localStorage.getItem(configKey));
        createConfigurationThumbnail(configKey, savedProduct);
    });
}

// Run initialization when DOM is fully loaded
document.addEventListener('DOMContentLoaded', initApp);