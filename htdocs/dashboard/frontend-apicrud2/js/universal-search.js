// Universal Search Module
import { resources } from "./api-config.js";
import uiFeedback from "./ui-feedback.js";

class UniversalSearch {
    constructor() {
        this.searchData = {
            productos: [],
            clientes: [],
            usuarios: [],
            pedidos: []
        };
        this.isInitialized = false;
        this.searchInputs = [];
        this.searchResults = [];
    }

    // Initialize search system
    async init() {
        if (this.isInitialized) return;
        
        try {
            await this.loadAllData();
            this.bindSearchInputs();
            this.handleUrlSearchParam();
            this.isInitialized = true;
        } catch (error) {
            console.error("Failed to initialize universal search:", error);
            uiFeedback.error("Error al inicializar la búsqueda universal");
        }
    }

    // Load data from all entities
    async loadAllData() {
        const loadingEl = uiFeedback.loading('Cargando datos para búsqueda...');
        try {
            // Load all data in parallel
            const [productos, clientes, usuarios, pedidos] = await Promise.all([
                resources.productos.getAll().catch(() => []),
                resources.clientes.getAll().catch(() => []),
                resources.usuarios.getAll().catch(() => []),
                resources.pedidos.getAll().catch(() => [])
            ]);

            // Filter active products only
            this.searchData.productos = productos.filter(p => p.activo == 1 || p.activo === '1' || p.activo === true);
            this.searchData.clientes = clientes;
            this.searchData.usuarios = usuarios;
            this.searchData.pedidos = pedidos;
            
        } catch (error) {
            console.error("Error loading search data:", error);
            throw error;
        } finally {
            uiFeedback.hideLoading();
        }
    }

    // Bind search functionality to all search inputs on the page
    bindSearchInputs() {
        // Find all search inputs with placeholder "Search for..."
        const searchInputs = document.querySelectorAll('input[placeholder*="Search for"]');
        
        searchInputs.forEach(input => {
            this.setupSearchInput(input);
        });

        // Also find any existing search inputs that might have different placeholders
        const existingSearchInputs = document.querySelectorAll('#search-input, .navbar-search input');
        existingSearchInputs.forEach(input => {
            this.setupSearchInput(input);
        });
    }

    // Setup individual search input
    setupSearchInput(input) {
        if (input.dataset.universalSearchBound) return; // Already bound
        
        input.dataset.universalSearchBound = 'true';
        input.placeholder = "Buscar productos, clientes, usuarios, pedidos...";
        
        // Add search icon click handler for buttons
        const searchButton = input.parentElement.querySelector('button, .input-group-append button');
        if (searchButton) {
            searchButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.performSearch(input.value.trim());
            });
        }

        // Add enter key handler
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.performSearch(input.value.trim());
            }
        });

        // Add real-time search for inputs with existing search behavior (like product listing)
        if (input.id === 'search-input') {
            input.addEventListener('input', (e) => {
                const query = e.target.value.trim();
                if (query.length > 0) {
                    this.performInlineSearch(query);
                } else {
                    this.clearInlineSearch();
                }
            });
        }
    }

    // Perform search and redirect to results page
    performSearch(query) {
        if (!query) {
            uiFeedback.warning('Por favor ingresa un término de búsqueda');
            return;
        }

        // Encode the search query for URL
        const encodedQuery = encodeURIComponent(query);
        
        // Redirect to search results page with query parameter
        window.location.href = `search-results.html?q=${encodedQuery}`;
    }

    // Perform inline search (for existing search functionality)
    performInlineSearch(query) {
        if (window.searchProductTable && typeof window.searchProductTable === 'function') {
            // Use existing product search if available
            window.searchProductTable();
            return;
        }

        // Generic inline search implementation
        this.searchResults = this.search(query);
        this.displayInlineResults();
    }

    // Clear inline search
    clearInlineSearch() {
        if (window.getTableData && typeof window.getTableData === 'function') {
            // Restore original table if available
            window.getTableData();
        }
    }

    // Core search functionality
    search(query) {
        if (!query) return [];

        const searchTerm = query.toLowerCase();
        const results = {
            productos: [],
            clientes: [],
            usuarios: [],
            pedidos: [],
            total: 0
        };

        // Search products
        results.productos = this.searchData.productos.filter(producto => 
            producto.nombre?.toLowerCase().includes(searchTerm) ||
            producto.descripcion?.toLowerCase().includes(searchTerm)
        );

        // Search clients
        results.clientes = this.searchData.clientes.filter(cliente => 
            cliente.nombre?.toLowerCase().includes(searchTerm) ||
            cliente.apellido?.toLowerCase().includes(searchTerm) ||
            cliente.email?.toLowerCase().includes(searchTerm) ||
            `${cliente.nombre} ${cliente.apellido}`.toLowerCase().includes(searchTerm)
        );

        // Search users
        results.usuarios = this.searchData.usuarios.filter(usuario => 
            usuario.usuario?.toLowerCase().includes(searchTerm) ||
            usuario.nombre_usuario?.toLowerCase().includes(searchTerm) ||
            usuario.rol?.toLowerCase().includes(searchTerm)
        );

        // Search orders
        results.pedidos = this.searchData.pedidos.filter(pedido => 
            pedido.id?.toString().includes(searchTerm) ||
            pedido.cliente_nombre?.toLowerCase().includes(searchTerm) ||
            pedido.metodo_pago?.toLowerCase().includes(searchTerm)
        );

        results.total = results.productos.length + results.clientes.length + 
                       results.usuarios.length + results.pedidos.length;

        return results;
    }

    // Display inline results (for current page search)
    displayInlineResults() {
        // This would be implemented based on the current page context
        // For now, we'll leave it as a placeholder since each page handles display differently
    }

    // Handle URL search parameter (for direct links)
    handleUrlSearchParam() {
        const urlParams = new URLSearchParams(window.location.search);
        const searchQuery = urlParams.get('q');
        
        if (searchQuery) {
            // If we're on the search results page, don't redirect
            if (window.location.pathname.includes('search-results.html')) {
                return;
            }
            
            // Fill search inputs with query
            const searchInputs = document.querySelectorAll('input[placeholder*="Buscar"], #search-input');
            searchInputs.forEach(input => {
                input.value = decodeURIComponent(searchQuery);
            });
        }
    }

    // Generate direct link to entity
    generateDirectLink(type, id) {
        const linkMap = {
            'productos': `listado-pro.html?highlight=${id}`,
            'clientes': `listado-clientes.html?highlight=${id}`,
            'usuarios': `listado-usuarios.html?highlight=${id}`,
            'pedidos': `listado-pedidos.html?highlight=${id}`
        };
        
        return linkMap[type] || '#';
    }

    // Get search suggestions for autocomplete (future feature)
    getSearchSuggestions(query, limit = 5) {
        if (!query || query.length < 2) return [];
        
        const suggestions = [];
        const searchTerm = query.toLowerCase();
        
        // Get product suggestions
        this.searchData.productos.forEach(producto => {
            if (producto.nombre?.toLowerCase().includes(searchTerm)) {
                suggestions.push({
                    type: 'producto',
                    text: producto.nombre,
                    subtitle: `Producto - $${producto.precio}`,
                    id: producto.id
                });
            }
        });
        
        // Get client suggestions
        this.searchData.clientes.forEach(cliente => {
            const fullName = `${cliente.nombre} ${cliente.apellido}`;
            if (fullName.toLowerCase().includes(searchTerm)) {
                suggestions.push({
                    type: 'cliente',
                    text: fullName,
                    subtitle: `Cliente - ${cliente.email}`,
                    id: cliente.id
                });
            }
        });
        
        return suggestions.slice(0, limit);
    }

    // Refresh search data (call when data changes)
    async refresh() {
        await this.loadAllData();
    }
}

// Create global instance
const universalSearch = new UniversalSearch();

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    await universalSearch.init();
});

// Export for manual usage
export default universalSearch;
