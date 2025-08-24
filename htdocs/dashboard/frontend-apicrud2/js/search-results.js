// Search Results Page JavaScript
import { initAuthGuard } from "./auth-guard.js";
import { resources } from "./api-config.js";
import uiFeedback from "./ui-feedback.js";

// Global variables
let currentSearchQuery = '';
let searchResults = null;
let currentCategory = 'all';
let searchStartTime = 0;

// DOM elements
const elements = {
    currentQuery: document.querySelector('#current-query'),
    totalResults: document.querySelector('#total-results'),
    searchTime: document.querySelector('#search-time'),
    loadingState: document.querySelector('#loading-state'),
    noResults: document.querySelector('#no-results'),
    resultsList: document.querySelector('#results-list'),
    categoryButtons: document.querySelectorAll('[data-category]'),
    newSearchForm: document.querySelector('#new-search-form'),
    newSearchInput: document.querySelector('#new-search-input'),
    topbarSearch: document.querySelector('#topbar-search'),
    mobileSearch: document.querySelector('#mobile-search'),
    nameUser: document.querySelector('#nombre-usuario'),
    btnLogout: document.querySelector('#btnLogout')
};

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    // Add authentication guard
    if (!initAuthGuard({ requireAuth: true })) {
        return;
    }

    setupEventListeners();
    setupUserInfo();
    
    // Get search query from URL
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q');
    
    if (query) {
        currentSearchQuery = decodeURIComponent(query);
        elements.currentQuery.textContent = currentSearchQuery;
        elements.newSearchInput.value = currentSearchQuery;
        elements.topbarSearch.value = currentSearchQuery;
        elements.mobileSearch.value = currentSearchQuery;
        
        await performSearch(currentSearchQuery);
    } else {
        showNoResults('No se especificó un término de búsqueda');
    }
});

// Setup event listeners
function setupEventListeners() {
    // Logout button
    elements.btnLogout.addEventListener('click', () => {
        localStorage.removeItem("userLogin");
        location.href = "login.html";
    });

    // Category filter buttons
    elements.categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            currentCategory = button.dataset.category;
            
            // Update active button
            elements.categoryButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Filter and display results
            if (searchResults) {
                displayResults(searchResults);
            }
        });
    });

    // New search form
    elements.newSearchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const query = elements.newSearchInput.value.trim();
        if (query) {
            window.location.href = `search-results.html?q=${encodeURIComponent(query)}`;
        }
    });

    // Topbar search
    const topbarButton = elements.topbarSearch.parentElement.querySelector('button');
    if (topbarButton) {
        topbarButton.addEventListener('click', (e) => {
            e.preventDefault();
            const query = elements.topbarSearch.value.trim();
            if (query) {
                window.location.href = `search-results.html?q=${encodeURIComponent(query)}`;
            }
        });
    }

    // Mobile search
    const mobileButton = elements.mobileSearch.parentElement.querySelector('button');
    if (mobileButton) {
        mobileButton.addEventListener('click', (e) => {
            e.preventDefault();
            const query = elements.mobileSearch.value.trim();
            if (query) {
                window.location.href = `search-results.html?q=${encodeURIComponent(query)}`;
            }
        });
    }

    // Enter key handlers
    elements.topbarSearch.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const query = elements.topbarSearch.value.trim();
            if (query) {
                window.location.href = `search-results.html?q=${encodeURIComponent(query)}`;
            }
        }
    });

    elements.mobileSearch.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const query = elements.mobileSearch.value.trim();
            if (query) {
                window.location.href = `search-results.html?q=${encodeURIComponent(query)}`;
            }
        }
    });
}

// Setup user info
function setupUserInfo() {
    const user = JSON.parse(localStorage.getItem("userLogin") || "{}");
    elements.nameUser.textContent = user.usuario || user.nombre_usuario || user.nombre || "Invitado";
}

// Perform search across all entities
async function performSearch(query) {
    if (!query) return;

    searchStartTime = performance.now();
    showLoading();

    try {
        // Load all data in parallel
        const [productos, clientes, usuarios, pedidos] = await Promise.all([
            resources.productos.getAll().catch(() => []),
            resources.clientes.getAll().catch(() => []),
            resources.usuarios.getAll().catch(() => []),
            resources.pedidos.getAll().catch(() => [])
        ]);

        // Filter and search data
        const searchTerm = query.toLowerCase();
        
        const results = {
            productos: productos.filter(p => 
                (p.activo == 1 || p.activo === '1' || p.activo === true) && (
                p.nombre?.toLowerCase().includes(searchTerm) ||
                p.descripcion?.toLowerCase().includes(searchTerm)
            )),
            clientes: clientes.filter(c => 
                c.nombre?.toLowerCase().includes(searchTerm) ||
                c.apellido?.toLowerCase().includes(searchTerm) ||
                c.email?.toLowerCase().includes(searchTerm) ||
                `${c.nombre} ${c.apellido}`.toLowerCase().includes(searchTerm) ||
                c.direccion?.toLowerCase().includes(searchTerm) ||
                c.celular?.includes(searchTerm)
            ),
            usuarios: usuarios.filter(u => 
                u.usuario?.toLowerCase().includes(searchTerm) ||
                u.nombre_usuario?.toLowerCase().includes(searchTerm) ||
                u.rol?.toLowerCase().includes(searchTerm)
            ),
            pedidos: pedidos.filter(p => 
                p.id?.toString().includes(searchTerm) ||
                p.cliente_nombre?.toLowerCase().includes(searchTerm) ||
                p.metodo_pago?.toLowerCase().includes(searchTerm) ||
                p.estado?.toLowerCase().includes(searchTerm)
            )
        };

        results.total = results.productos.length + results.clientes.length + 
                       results.usuarios.length + results.pedidos.length;

        searchResults = results;
        displayResults(results);

    } catch (error) {
        console.error("Error performing search:", error);
        uiFeedback.error('Error al realizar la búsqueda. Verifica que el servidor esté funcionando.');
        showNoResults('Error al conectar con el servidor');
    }
}

// Display search results
function displayResults(results) {
    hideLoading();

    const searchEndTime = performance.now();
    const searchDuration = ((searchEndTime - searchStartTime) / 1000).toFixed(2);

    // Update stats
    elements.totalResults.textContent = `${results.total} resultado${results.total !== 1 ? 's' : ''} encontrado${results.total !== 1 ? 's' : ''}`;
    elements.searchTime.textContent = `Tiempo de búsqueda: ${searchDuration}s`;

    // Clear previous results
    elements.resultsList.innerHTML = '';

    if (results.total === 0) {
        showNoResults();
        return;
    }

    // Display results by category
    const categoriesToShow = currentCategory === 'all' ? 
        ['productos', 'clientes', 'usuarios', 'pedidos'] : 
        [currentCategory];

    let hasVisibleResults = false;

    categoriesToShow.forEach(category => {
        const categoryResults = results[category];
        if (categoryResults && categoryResults.length > 0) {
            hasVisibleResults = true;
            
            // Add category header
            const categoryHeader = createCategoryHeader(category, categoryResults.length);
            elements.resultsList.appendChild(categoryHeader);

            // Add results
            categoryResults.forEach(item => {
                const resultElement = createResultElement(category, item);
                elements.resultsList.appendChild(resultElement);
            });
        }
    });

    if (!hasVisibleResults) {
        showNoResults(`No se encontraron resultados en la categoría "${getCategoryName(currentCategory)}"`);
    } else {
        hideNoResults();
    }
}

// Create category header
function createCategoryHeader(category, count) {
    const header = document.createElement('div');
    header.className = 'mb-3 mt-4';
    
    const icon = getCategoryIcon(category);
    const name = getCategoryName(category);
    
    header.innerHTML = `
        <h5 class="text-primary">
            <i class="${icon}"></i> ${name} 
            <span class="badge badge-primary ml-2">${count}</span>
        </h5>
        <hr>
    `;
    
    return header;
}

// Create result element
function createResultElement(category, item) {
    const resultDiv = document.createElement('div');
    resultDiv.className = 'search-result-item';
    resultDiv.style.cursor = 'pointer';
    
    const { title, description, meta, directLink } = formatResultData(category, item);
    
    // Highlight search terms
    const highlightedTitle = highlightText(title, currentSearchQuery);
    const highlightedDescription = highlightText(description, currentSearchQuery);
    
    resultDiv.innerHTML = `
        <div class="d-flex justify-content-between align-items-start">
            <div class="flex-grow-1">
                <div class="d-flex align-items-center mb-2">
                    <span class="badge result-type-badge ${getCategoryBadgeClass(category)}">
                        <i class="${getCategoryIcon(category)}"></i> ${getCategoryName(category)}
                    </span>
                </div>
                <h6 class="result-title">${highlightedTitle}</h6>
                <p class="result-description mb-1">${highlightedDescription}</p>
                <div class="result-meta">${meta}</div>
            </div>
            <div class="ml-3">
                <i class="fas fa-external-link-alt text-muted"></i>
            </div>
        </div>
    `;
    
    // Add click handler
    resultDiv.addEventListener('click', () => {
        if (directLink && directLink !== '#') {
            window.location.href = directLink;
        }
    });
    
    return resultDiv;
}

// Format result data based on category
function formatResultData(category, item) {
    switch (category) {
        case 'productos':
            return {
                title: item.nombre || 'Sin nombre',
                description: item.descripcion || 'Sin descripción',
                meta: `Precio: $${item.precio || '0'} | Stock: ${item.stock || '0'}`,
                directLink: `listado-pro.html?highlight=${item.id}`
            };
        
        case 'clientes':
            return {
                title: `${item.nombre || ''} ${item.apellido || ''}`.trim() || 'Sin nombre',
                description: item.email || 'Sin email',
                meta: `${item.direccion || 'Sin dirección'} | ${item.celular || 'Sin teléfono'}`,
                directLink: `listado-clientes.html?highlight=${item.id}`
            };
        
        case 'usuarios':
            return {
                title: item.usuario || item.nombre_usuario || 'Sin nombre de usuario',
                description: `Rol: ${item.rol || 'Sin rol'}`,
                meta: `ID: ${item.id || 'N/A'}`,
                directLink: `listado-usuarios.html?highlight=${item.id}`
            };
        
        case 'pedidos':
            return {
                title: `Pedido #${item.id || 'N/A'}`,
                description: `Cliente: ${item.cliente_nombre || 'Sin cliente'}`,
                meta: `${item.metodo_pago || 'Sin método'} | Total: $${item.total || '0'} | ${item.estado || 'Sin estado'}`,
                directLink: `listado-pedidos.html?highlight=${item.id}`
            };
        
        default:
            return {
                title: 'Resultado desconocido',
                description: '',
                meta: '',
                directLink: '#'
            };
    }
}

// Highlight search terms in text
function highlightText(text, searchTerm) {
    if (!text || !searchTerm) return text;
    
    const regex = new RegExp(`(${escapeRegExp(searchTerm)})`, 'gi');
    return text.replace(regex, '<span class="highlight">$1</span>');
}

// Escape special regex characters
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Get category display name
function getCategoryName(category) {
    const names = {
        'productos': 'Productos',
        'clientes': 'Clientes', 
        'usuarios': 'Usuarios',
        'pedidos': 'Pedidos',
        'all': 'Todos'
    };
    return names[category] || category;
}

// Get category icon
function getCategoryIcon(category) {
    const icons = {
        'productos': 'fas fa-cog',
        'clientes': 'fas fa-users',
        'usuarios': 'fas fa-user-cog',
        'pedidos': 'fas fa-shopping-cart',
        'all': 'fas fa-th-large'
    };
    return icons[category] || 'fas fa-question';
}

// Get category badge class
function getCategoryBadgeClass(category) {
    const classes = {
        'productos': 'badge-success',
        'clientes': 'badge-info',
        'usuarios': 'badge-warning',
        'pedidos': 'badge-danger'
    };
    return classes[category] || 'badge-secondary';
}

// Show loading state
function showLoading() {
    elements.loadingState.style.display = 'block';
    elements.noResults.style.display = 'none';
    elements.resultsList.innerHTML = '';
}

// Hide loading state
function hideLoading() {
    elements.loadingState.style.display = 'none';
}

// Show no results
function showNoResults(message = 'No se encontraron resultados para tu búsqueda.') {
    hideLoading();
    elements.noResults.style.display = 'block';
    
    // Update message if custom one provided
    if (message !== 'No se encontraron resultados para tu búsqueda.') {
        elements.noResults.querySelector('p').textContent = message;
    }
}

// Hide no results
function hideNoResults() {
    elements.noResults.style.display = 'none';
}

// Export functions for external use
window.searchResultsPage = {
    performSearch,
    displayResults
};
