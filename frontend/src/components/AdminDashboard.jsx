import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, Package, FolderTree, Settings, LogOut, X, 
  MessageSquare, RefreshCw, Plus, Trash2, Edit, Save, AlertCircle, CheckCircle2, Lock, Archive, Menu 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useShop } from '../context/ShopContext';
import { api } from '../services/api';
import { formatPrice } from '../utils/formatPrice';
import { getImageUrl } from '../utils/imageUrl';
import './AdminDashboard.css';

// Replace with a secure way to manage admin keys in production
const ADMIN_SECRET = "secret123";

export const AdminDashboard = ({ onClose }) => {
  const { token, admin, logout } = useAuth();
  const { refreshSettings } = useShop();

  const [activeTab, setActiveTab] = useState('orders');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Orders State
  const [orders, setOrders] = useState([]);
  const [ordersPagination, setOrdersPagination] = useState({ page: 1, total_pages: 1 });
  const [orderStatusFilter, setOrderStatusFilter] = useState('');
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [whatsAppText, setWhatsAppText] = useState('');
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);

  // Order Deletion State
  const [deleteAllModalOpen, setDeleteAllModalOpen] = useState(false);
  const [deleteAllPassword, setDeleteAllPassword] = useState('');
  const [deleteAllConfirmation, setDeleteAllConfirmation] = useState('');
  const [orderActionLoading, setOrderActionLoading] = useState(false);
  const [orderActionError, setOrderActionError] = useState(null);

  // Products State
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [newProductModal, setNewProductModal] = useState(false);

  // Form State for Product Creation/Edit
  const [prodName, setProdName] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodCatId, setProdCatId] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodImage, setProdImage] = useState(null);
  const [prodIsAvailable, setProdIsAvailable] = useState(true);
  const [editingProduct, setEditingProduct] = useState(null);

  // Product Filters & Lifecycle State
  const [productFilter, setProductFilter] = useState('active');
  const [productToDeletePermanently, setProductToDeletePermanently] = useState(null);
  const [deleteTypeConfirmation, setDeleteTypeConfirmation] = useState('');
  const [productActionLoading, setProductActionLoading] = useState(false);
  const [productActionError, setProductActionError] = useState(null);

  // Categories State
  const [categories, setCategories] = useState([]);
  const [newCatName, setNewCatName] = useState('');
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [deleteCategoryLoading, setDeleteCategoryLoading] = useState(false);
  const [deleteCategoryError, setDeleteCategoryError] = useState(null);

  // Settings State
  const [settingsForm, setSettingsForm] = useState({
    shop_name: '',
    currency: 'LBP',
    whatsapp_number: '',
    address: '',
    is_accepting_orders: 1,
  });
  const [settingsSavedMsg, setSettingsSavedMsg] = useState(false);

  // Error State
  const [errorMsg, setErrorMsg] = useState(null);

  // Security Settings State
  const [securityForm, setSecurityForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [securityLoading, setSecurityLoading] = useState(false);
  const [securityError, setSecurityError] = useState(null);
  const [securityErrors, setSecurityErrors] = useState([]);
  const [securitySuccess, setSecuritySuccess] = useState('');

  // Fetch Orders
  const fetchOrders = async (page = 1) => {
    setLoadingOrders(true);
    try {
      const res = await api.getAdminOrders(
        { status: orderStatusFilter || undefined, page },
        token
      );
      setOrders(res.data.items || []);
      setOrdersPagination(res.data.pagination || { page: 1, total_pages: 1 });
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Export Orders
  const handleExportOrders = async () => {
    try {
      const blob = await api.exportOrders(token);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orders-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to export orders');
    }
  };

  // Delete Single Order
  const handleDeleteOrder = async (id, orderNumber) => {
    const confirmation = window.prompt(`Delete Order #${orderNumber} permanently?\nThis will permanently delete the order and all of its order items.\nThis action cannot be undone.\n\nType DELETE to confirm:`);
    if (confirmation !== 'DELETE') return;
    
    try {
      await api.deleteOrder(id, token);
      alert('Order deleted permanently.');
      fetchOrders(ordersPagination.page);
    } catch (err) {
      alert(err.message || 'Failed to delete order');
    }
  };

  // Delete All Orders Flow
  const openDeleteAllModal = () => {
    setDeleteAllModalOpen(true);
    setDeleteAllPassword('');
    setDeleteAllConfirmation('');
    setOrderActionError(null);
  };

  const closeDeleteAllModal = () => {
    setDeleteAllModalOpen(false);
    setDeleteAllPassword('');
    setDeleteAllConfirmation('');
    setOrderActionError(null);
  };

  const confirmDeleteAllOrders = async () => {
    if (deleteAllConfirmation !== 'DELETE ALL ORDERS') return;
    if (!deleteAllPassword) return;

    setOrderActionLoading(true);
    setOrderActionError(null);

    try {
      const payload = { current_password: deleteAllPassword, confirmation: deleteAllConfirmation };
      const res = await api.deleteAllOrders(payload, token);
      alert(`Success: ${res.message}\nDeleted Orders: ${res.data.deleted_orders}\nDeleted Items: ${res.data.deleted_order_items}`);
      closeDeleteAllModal();
      fetchOrders(1);
    } catch (err) {
      setOrderActionError(err.message || 'Failed to delete all orders');
    } finally {
      setOrderActionLoading(false);
    }
  };

  // Fetch Products & Categories
  const fetchProductsAndCategories = async (filterOverride) => {
    setLoadingProducts(true);
    const filterToUse = filterOverride || productFilter;
    try {
      const [prodRes, catRes] = await Promise.all([
        api.getAdminProducts(token, filterToUse),
        api.getCategories(),
      ]);
      setProducts(prodRes.data || []);
      setCategories(catRes.data || []);
    } catch (err) {
      console.error('Error fetching products/categories:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchProductsAndCategories(productFilter);
  }, [productFilter]);

  // Fetch Shop Settings
  const fetchSettingsData = async () => {
    try {
      const res = await api.getShopSettings();
      if (res.data && Object.keys(res.data).length > 0) {
        setSettingsForm(res.data);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'orders') fetchOrders(1);
    if (activeTab === 'products') fetchProductsAndCategories();
    if (activeTab === 'categories') fetchProductsAndCategories();
    if (activeTab === 'settings') fetchSettingsData();
  }, [activeTab, orderStatusFilter]);

  // Handle Order Status Update
  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await api.updateOrderStatus(orderId, newStatus, token);
      fetchOrders(ordersPagination.page);
      if (selectedOrder && selectedOrder.id === orderId) {
        const detailsRes = await api.getOrderDetails(orderId, token);
        setSelectedOrder(detailsRes.data);
      }
    } catch (err) {
      alert(err.message || 'Status transition invalid');
    }
  };

  // View Order Details
  const handleViewOrderDetails = async (orderId) => {
    try {
      const res = await api.getOrderDetails(orderId, token);
      setSelectedOrder(res.data);
    } catch (err) {
      alert('Could not fetch order details');
    }
  };

  // Generate WhatsApp Message
  const handleOpenWhatsAppModal = async (orderId) => {
    try {
      const res = await api.getWhatsAppMessage(orderId, token);
      setWhatsAppText(res.data);
      setWhatsAppModalOpen(true);
    } catch (err) {
      alert('Could not generate WhatsApp text');
    }
  };

  // Create Product Submit
  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    const formData = new FormData();
    formData.append('name', prodName);
    formData.append('price', prodPrice);
    formData.append('category_id', prodCatId);
    formData.append('is_available', prodIsAvailable ? 1 : 0);
    if (prodDesc) formData.append('description', prodDesc);
    if (prodImage) formData.append('image', prodImage);

    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct.id, formData, token);
      } else {
        await api.createProduct(formData, token);
      }
      setNewProductModal(false);
      resetProductForm();
      fetchProductsAndCategories();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save product');
    }
  };

  // Archive Product
  const handleArchiveProduct = async (id) => {
    if (!window.confirm('Are you sure you want to archive this product?\nIt will be hidden from customers but preserved for order history.')) return;
    try {
      await api.archiveProduct(id, token);
      alert('Product archived successfully.');
      fetchProductsAndCategories();
    } catch (err) {
      alert(err.message || 'Failed to archive product');
    }
  };

  // Restore Product
  const handleRestoreProduct = async (id) => {
    if (!window.confirm('Restore this product to the active catalog?')) return;
    try {
      await api.restoreProduct(id, token);
      alert('Product restored successfully.');
      fetchProductsAndCategories();
    } catch (err) {
      alert(err.message || 'Failed to restore product');
    }
  };

  // Permanent Delete Modal Setup
  const openPermanentDeleteModal = (product) => {
    setProductToDeletePermanently(product);
    setDeleteTypeConfirmation('');
    setProductActionError(null);
  };

  const closePermanentDeleteModal = () => {
    setProductToDeletePermanently(null);
    setDeleteTypeConfirmation('');
    setProductActionError(null);
  };

  const confirmPermanentDelete = async () => {
    if (!productToDeletePermanently || deleteTypeConfirmation !== 'DELETE') return;
    setProductActionLoading(true);
    setProductActionError(null);

    try {
      await api.permanentlyDeleteProduct(productToDeletePermanently.id, token);
      alert('Product permanently deleted.');
      closePermanentDeleteModal();
      fetchProductsAndCategories();
    } catch (err) {
      setProductActionError(err.message || 'Failed to permanently delete product');
    } finally {
      setProductActionLoading(false);
    }
  };

  // Create Category
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      await api.createCategory({ name: newCatName.trim() }, token);
      setNewCatName('');
      fetchProductsAndCategories();
    } catch (err) {
      alert(err.message || 'Failed to create category');
    }
  };

  // Delete Category
  const handleDeleteCategoryRequest = (category) => {
    setCategoryToDelete(category);
    setDeleteCategoryError(null);
  };

  const closeDeleteCategoryModal = () => {
    setCategoryToDelete(null);
    setDeleteCategoryError(null);
  };

  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;
    setDeleteCategoryLoading(true);
    setDeleteCategoryError(null);

    try {
      await api.deleteCategory(categoryToDelete.id, token);
      setCategoryToDelete(null);
      fetchProductsAndCategories(); // refresh categories list
    } catch (err) {
      setDeleteCategoryError(err.message || 'Failed to delete category');
    } finally {
      setDeleteCategoryLoading(false);
    }
  };

  // Save Settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      await api.updateShopSettings(settingsForm, token);
      refreshSettings();
      setSettingsSavedMsg(true);
      setTimeout(() => setSettingsSavedMsg(false), 2000);
    } catch (err) {
      alert(err.message || 'Failed to save settings');
    }
  };

  // Change Password
  const handleSecuritySubmit = async (e) => {
    e.preventDefault();
    setSecurityError(null);
    setSecurityErrors([]);
    setSecuritySuccess('');
    setSecurityLoading(true);

    try {
      const res = await api.changeAdminPassword(securityForm, token);
      setSecuritySuccess(res.message);
      setSecurityForm({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
      setTimeout(() => {
        logout();
      }, 3000);
    } catch (err) {
      setSecurityError(err.message);
      if (err.errors) {
        setSecurityErrors(err.errors);
      }
    } finally {
      setSecurityLoading(false);
    }
  };

  const resetProductForm = () => {
    setProdName('');
    setProdPrice('');
    setProdCatId('');
    setProdDesc('');
    setProdImage(null);
    setProdIsAvailable(true);
    setEditingProduct(null);
  };

  const openEditProduct = (product) => {
    setEditingProduct(product);
    setProdName(product.name);
    setProdPrice(product.price);
    setProdCatId(product.category_id);
    setProdDesc(product.description || '');
    setProdIsAvailable(product.is_available === 1);
    setNewProductModal(true);
  };

  return (
    <div className={`admin-dashboard-layout ${isSidebarOpen ? 'sidebar-open' : ''}`}>
      {/* Mobile Backdrop */}
      <div 
        className={`admin-sidebar-backdrop ${isSidebarOpen ? 'open' : ''}`} 
        onClick={() => setIsSidebarOpen(false)}
      ></div>

      {/* Sidebar Navigation */}
      <aside className={`admin-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <span className="brand-title">SAADO <span>DROP</span></span>
          <span className="admin-tag">SaaS Admin Portal</span>
          <button className="mobile-close-sidebar-btn" onClick={() => setIsSidebarOpen(false)}>
            <X size={24} />
          </button>
        </div>

        <nav className="sidebar-menu">
          <button
            className={`sidebar-link ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => { setActiveTab('orders'); setIsSidebarOpen(false); }}
          >
            <ShoppingBag size={18} />
            <span>Customer Orders</span>
          </button>

          <button
            className={`sidebar-link ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => { setActiveTab('products'); setIsSidebarOpen(false); }}
          >
            <Package size={18} />
            <span>Product Catalog</span>
          </button>

          <button
            className={`sidebar-link ${activeTab === 'categories' ? 'active' : ''}`}
            onClick={() => { setActiveTab('categories'); setIsSidebarOpen(false); }}
          >
            <FolderTree size={18} />
            <span>Categories</span>
          </button>

          <button
            className={`sidebar-link ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => { setActiveTab('settings'); setIsSidebarOpen(false); }}
          >
            <Settings size={18} />
            <span>Shop Settings</span>
          </button>

          <button
            className={`sidebar-link ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => { setActiveTab('security'); setIsSidebarOpen(false); }}
          >
            <Lock size={18} />
            <span>Security</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="admin-user-info">
            <span>Signed in as <strong>{admin?.username || 'Admin'}</strong></span>
          </div>
          <button className="logout-btn" onClick={logout}>
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
          <button className="exit-portal-btn" onClick={onClose}>
            Back to Website
          </button>
        </div>
      </aside>

      {/* Main Content Dashboard Workspace */}
      <main className="admin-workspace">
        {/* Workspace Top Header */}
        <header className="workspace-header">
          <div className="workspace-header-title-group">
            <button className="mobile-menu-btn" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              <Menu size={24} />
            </button>
            <h2>
              {activeTab === 'orders' && 'Order Management'}
              {activeTab === 'products' && 'Product Catalog'}
              {activeTab === 'categories' && 'Category Management'}
              {activeTab === 'settings' && 'Global Shop Settings'}
              {activeTab === 'security' && 'Security Settings'}
            </h2>
          </div>

          {activeTab === 'orders' && (
            <button className="btn-outline refresh-btn" onClick={() => fetchOrders(ordersPagination.page)}>
              <RefreshCw size={16} />
              <span>Refresh</span>
            </button>
          )}

          {activeTab === 'products' && (
            <button className="btn-gold" onClick={() => { resetProductForm(); setNewProductModal(true); }}>
              <Plus size={16} />
              <span>Add New Product</span>
            </button>
          )}
        </header>

        {/* TAB 1: ORDERS MANAGEMENT */}
        {activeTab === 'orders' && (
          <div className="tab-content">
            {/* Filter Bar */}
            <div className="admin-filter-bar">
              <span className="filter-label">Filter Status:</span>
              {['', 'pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'].map((st) => (
                <button
                  key={st}
                  className={`filter-chip ${orderStatusFilter === st ? 'active' : ''}`}
                  onClick={() => setOrderStatusFilter(st)}
                >
                  {st ? st.toUpperCase() : 'ALL'}
                </button>
              ))}
            </div>

            {/* Orders Table */}
            <div className="table-container surface-card">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Customer</th>
                    <th>Type</th>
                    <th>Subtotal</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingOrders ? (
                    <tr>
                      <td colSpan="7" className="table-loading">Loading orders...</td>
                    </tr>
                  ) : orders.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="table-empty">No orders found.</td>
                    </tr>
                  ) : (
                    orders.map((o) => (
                      <tr key={o.id}>
                        <td data-label="Order #" className="font-mono text-gold">#{o.order_number}</td>
                        <td data-label="Customer">
                          <strong>{o.customer_name}</strong>
                          <div className="table-subtext">{o.customer_phone}</div>
                        </td>
                        <td data-label="Type">
                          <span className={`type-badge ${o.order_type}`}>
                            {o.order_type.toUpperCase()}
                          </span>
                        </td>
                        <td data-label="Subtotal" className="font-mono">{formatPrice(o.subtotal)}</td>
                        <td data-label="Status">
                          <select
                            className={`status-select status-${o.status}`}
                            value={o.status}
                            onChange={(e) => handleUpdateStatus(o.id, e.target.value)}
                          >
                            <option value="pending">PENDING</option>
                            <option value="confirmed">CONFIRMED</option>
                            <option value="preparing">PREPARING</option>
                            <option value="ready">READY</option>
                            <option value="completed">COMPLETED</option>
                            <option value="cancelled">CANCELLED</option>
                          </select>
                        </td>
                        <td data-label="Created" className="table-subtext">{new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                        <td data-label="Actions">
                          <div className="table-actions">
                            <button
                              className="action-btn"
                              onClick={() => handleViewOrderDetails(o.id)}
                              title="View Items & Details"
                            >
                              Details
                            </button>
                              <button
                                className="action-btn whatsapp-action"
                                onClick={() => handleOpenWhatsAppModal(o.id)}
                                title="Generate WhatsApp Text"
                              >
                                <MessageSquare size={14} />
                              </button>
                              <button
                                className="action-btn delete-action"
                                onClick={() => handleDeleteOrder(o.id, o.order_number)}
                                title="Delete Order Permanently"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {ordersPagination.total_pages > 1 && (
              <div className="pagination-bar">
                <button
                  disabled={ordersPagination.page <= 1}
                  onClick={() => fetchOrders(ordersPagination.page - 1)}
                >
                  Previous
                </button>
                <span>Page {ordersPagination.page} of {ordersPagination.total_pages}</span>
                <button
                  disabled={ordersPagination.page >= ordersPagination.total_pages}
                  onClick={() => fetchOrders(ordersPagination.page + 1)}
                >
                  Next
                </button>
              </div>
            )}

            {/* Danger Zone */}
            <div className="surface-card" style={{ marginTop: '30px', borderTop: '4px solid #dc3545', padding: '20px' }}>
              <h3 style={{ color: '#dc3545', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
                <AlertCircle size={20} /> DANGER ZONE
              </h3>
              <p style={{ color: '#ccc', marginBottom: '20px', fontSize: '14px' }}>
                Actions here are permanent and cannot be undone. Please ensure you have backed up any necessary data.
              </p>
              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                <button className="btn-outline" onClick={handleExportOrders} title="Export Orders as JSON">
                  Export All Orders
                </button>
                <button 
                  className="btn-gold" 
                  style={{ background: '#dc3545', borderColor: '#dc3545', color: '#fff' }}
                  onClick={openDeleteAllModal}
                >
                  Delete All Orders
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PRODUCTS CATALOG */}
        {activeTab === 'products' && (
          <div className="tab-content">
            {/* Product Filters */}
            <div className="admin-tabs" style={{ marginBottom: '20px', justifyContent: 'flex-start' }}>
              <button
                className={`admin-tab ${productFilter === 'active' ? 'active' : ''}`}
                onClick={() => setProductFilter('active')}
              >
                Active Products
              </button>
              <button
                className={`admin-tab ${productFilter === 'archived' ? 'active' : ''}`}
                onClick={() => setProductFilter('archived')}
              >
                Archived Products
              </button>
              <button
                className={`admin-tab ${productFilter === 'all' ? 'active' : ''}`}
                onClick={() => setProductFilter('all')}
              >
                All Products
              </button>
            </div>

            <div className="table-container surface-card">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Product Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id} className={p.is_active === 0 ? 'row-deactivated' : ''}>
                      <td data-label="Image">
                        <img
                          src={getImageUrl(p.image_url)}
                          alt={p.name}
                          className="table-img"
                        />
                      </td>
                      <td data-label="Product Name">
                        <strong>{p.name}</strong>
                        {p.is_active === 0 && <span className="deactivated-badge" style={{ marginLeft: '8px', background: '#333', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>Archived</span>}
                      </td>
                      <td data-label="Category">{categories.find((c) => c.id === p.category_id)?.name || 'General'}</td>
                      <td data-label="Price" className="font-mono text-gold">{formatPrice(p.price)}</td>
                      <td data-label="Status">
                        {p.is_active === 1 ? (
                          <span className={`avail-badge ${p.is_available === 1 ? 'open' : 'closed'}`}>
                            {p.is_available === 1 ? 'Available' : 'Sold Out'}
                          </span>
                        ) : (
                          <span className="avail-badge closed" style={{ background: '#444' }}>Archived</span>
                        )}
                      </td>
                      <td data-label="Actions">
                        <div className="table-actions">
                          <button className="action-btn" onClick={() => openEditProduct(p)} title="Edit Product">
                            <Edit size={14} />
                          </button>
                          
                          {p.is_active === 1 ? (
                            <button className="action-btn" style={{ color: '#f39c12' }} onClick={() => handleArchiveProduct(p.id)} title="Archive Product">
                              <Archive size={14} />
                            </button>
                          ) : (
                            <>
                              <button className="action-btn" style={{ color: '#28a745' }} onClick={() => handleRestoreProduct(p.id)} title="Restore Product">
                                <RefreshCw size={14} />
                              </button>
                              <button className="action-btn delete-action" onClick={() => openPermanentDeleteModal(p)} title="Delete Permanently">
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: CATEGORIES */}
        {activeTab === 'categories' && (
          <div className="tab-content">
            <form onSubmit={handleCreateCategory} className="create-category-form surface-card">
              <h3>Create New Category</h3>
              <div className="form-inline">
                <input
                  type="text"
                  placeholder="Category Name (e.g. Belgian Crepes)"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  required
                />
                <button type="submit" className="btn-gold">Add Category</button>
              </div>
            </form>

            <div className="table-container surface-card" style={{ marginTop: '24px' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Category ID</th>
                    <th>Category Name</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((c) => (
                    <tr key={c.id}>
                      <td data-label="Category ID" className="font-mono">#{c.id}</td>
                      <td data-label="Category Name"><strong>{c.name}</strong></td>
                      <td data-label="Status"><span className="avail-badge open">Active</span></td>
                      <td data-label="Actions">
                        <div className="table-actions">
                          <button className="action-btn delete-action" onClick={() => handleDeleteCategoryRequest(c)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: SHOP SETTINGS */}
        {activeTab === 'settings' && (
          <div className="tab-content">
            <form onSubmit={handleSaveSettings} className="settings-form surface-card">
              {settingsSavedMsg && (
                <div className="save-success-banner">
                  <CheckCircle2 size={16} />
                  <span>Shop Settings updated successfully!</span>
                </div>
              )}

              <div className="form-group">
                <label>Shop Name</label>
                <input
                  type="text"
                  value={settingsForm.shop_name}
                  onChange={(e) => setSettingsForm({ ...settingsForm, shop_name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Currency Code (e.g. LBP, USD)</label>
                <input
                  type="text"
                  value={settingsForm.currency}
                  onChange={(e) => setSettingsForm({ ...settingsForm, currency: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Official WhatsApp Phone Number</label>
                <input
                  type="text"
                  value={settingsForm.whatsapp_number}
                  onChange={(e) => setSettingsForm({ ...settingsForm, whatsapp_number: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Address</label>
                <input
                  type="text"
                  value={settingsForm.address}
                  onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Accepting Customer Orders Toggle</label>
                <select
                  value={settingsForm.is_accepting_orders}
                  onChange={(e) => setSettingsForm({ ...settingsForm, is_accepting_orders: Number(e.target.value) })}
                >
                  <option value={1}>Open (Accepting Orders)</option>
                  <option value={0}>Closed (Paused)</option>
                </select>
              </div>

              <button type="submit" className="btn-gold" style={{ marginTop: '16px' }}>
                <Save size={16} />
                <span>Save Settings</span>
              </button>
            </form>
          </div>
        )}

        {/* TAB 5: SECURITY SETTINGS */}
        {activeTab === 'security' && (
          <div className="tab-content">
            <form onSubmit={handleSecuritySubmit} className="settings-form surface-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
              <h3>Security Settings</h3>
              <p style={{ color: '#ccc', marginBottom: '20px', fontSize: '0.9rem' }}>
                Change your administrator password. You will be signed out automatically after a successful change.
              </p>

              {securitySuccess && (
                <div className="save-success-banner" style={{ marginBottom: '20px' }}>
                  <CheckCircle2 size={16} />
                  <span>{securitySuccess}</span>
                </div>
              )}

              {securityError && (
                <div className="admin-error-banner" style={{ marginBottom: '20px' }}>
                  <AlertCircle size={16} />
                  <div>
                    <span style={{ display: 'block', fontWeight: 'bold' }}>{securityError}</span>
                    {securityErrors.length > 0 && (
                      <ul style={{ margin: '8px 0 0 16px', fontSize: '0.9rem' }}>
                        {securityErrors.map((err, i) => (
                          <li key={i}>{err.message}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>Current Password</label>
                <input
                  type="password"
                  autoComplete="current-password"
                  required
                  value={securityForm.current_password}
                  onChange={(e) => setSecurityForm({ ...securityForm, current_password: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  required
                  value={securityForm.new_password}
                  onChange={(e) => setSecurityForm({ ...securityForm, new_password: e.target.value })}
                />
                <small style={{ color: '#aaa', display: 'block', marginTop: '6px' }}>
                  Must be at least 10 characters and contain uppercase, lowercase, number, and special character.
                </small>
              </div>

              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  required
                  value={securityForm.confirm_password}
                  onChange={(e) => setSecurityForm({ ...securityForm, confirm_password: e.target.value })}
                />
              </div>

              <button type="submit" className="btn-gold" style={{ marginTop: '16px' }} disabled={securityLoading}>
                <Lock size={16} />
                <span>{securityLoading ? 'Saving...' : 'Change Password'}</span>
              </button>
            </form>
          </div>
        )}
      </main>

      {/* Details Modal */}
      {selectedOrder && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-backdrop" onClick={() => setSelectedOrder(null)}></div>
          <div className="admin-modal-card surface-card" style={{ maxWidth: '560px' }}>
            <div className="admin-modal-header">
              <h3>ORDER #{selectedOrder.order_number} DETAILS</h3>
              <button className="modal-close-btn" onClick={() => setSelectedOrder(null)}><X size={18} /></button>
            </div>
            <div className="order-details-body">
              <p><strong>Customer:</strong> {selectedOrder.customer_name} ({selectedOrder.customer_phone})</p>
              <p><strong>Type:</strong> {selectedOrder.order_type}</p>
              {selectedOrder.delivery_address && <p><strong>Address:</strong> {selectedOrder.delivery_address}</p>}
              {selectedOrder.customer_notes && <p><strong>Notes:</strong> {selectedOrder.customer_notes}</p>}

              <h4 style={{ marginTop: '16px', marginBottom: '8px' }}>Items Ordered:</h4>
              <ul className="order-items-list">
                {selectedOrder.items.map((it) => (
                  <li key={it.id}>
                    <span>{it.quantity}x {it.product_name}</span>
                    <span className="font-mono">{formatPrice(it.line_total)}</span>
                  </li>
                ))}
              </ul>
              <div className="order-details-total">
                <span>Subtotal:</span>
                <span className="text-gold font-mono">{formatPrice(selectedOrder.subtotal)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Modal */}
      {whatsAppModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-backdrop" onClick={() => setWhatsAppModalOpen(false)}></div>
          <div className="admin-modal-card surface-card" style={{ maxWidth: '540px' }}>
            <div className="admin-modal-header">
              <h3>WHATSAPP MESSAGE TEXT</h3>
              <button className="modal-close-btn" onClick={() => setWhatsAppModalOpen(false)}><X size={18} /></button>
            </div>
            <textarea
              readOnly
              className="whatsapp-textarea"
              rows={12}
              value={whatsAppText}
            ></textarea>
            <button
              className="btn-gold"
              onClick={() => navigator.clipboard.writeText(whatsAppText)}
              style={{ width: '100%', marginTop: '12px' }}
            >
              Copy to Clipboard
            </button>
          </div>
        </div>
      )}

      {/* Product Creation / Edit Modal */}
      {newProductModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-backdrop" onClick={() => setNewProductModal(false)}></div>
          <div className="admin-modal-card surface-card" style={{ maxWidth: '500px' }}>
            <div className="admin-modal-header">
              <h3>{editingProduct ? 'EDIT PRODUCT' : 'NEW PRODUCT'}</h3>
              <button className="modal-close-btn" onClick={() => setNewProductModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleProductSubmit} className="admin-login-form">
              {errorMsg && (
                <div className="admin-error-banner">
                  <AlertCircle size={16} />
                  <span>{errorMsg}</span>
                </div>
              )}
              <div className="form-group">
                <label>Product Name *</label>
                <input type="text" required value={prodName} onChange={(e) => setProdName(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Price *</label>
                <input type="number" step="0.01" required value={prodPrice} onChange={(e) => setProdPrice(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Category *</label>
                <select required value={prodCatId} onChange={(e) => setProdCatId(e.target.value)}>
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea value={prodDesc} onChange={(e) => setProdDesc(e.target.value)} />
              </div>
              
              {editingProduct && (
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input 
                    type="checkbox" 
                    id="prod-avail" 
                    checked={prodIsAvailable} 
                    onChange={(e) => setProdIsAvailable(e.target.checked)} 
                    disabled={editingProduct.is_active === 0}
                    style={{ width: 'auto' }}
                  />
                  <label htmlFor="prod-avail" style={{ margin: 0 }}>
                    Product Available (In Stock)
                    {editingProduct.is_active === 0 && <span style={{ marginLeft: '10px', fontSize: '12px', color: '#dc3545' }}>(Disabled for archived products)</span>}
                  </label>
                </div>
              )}

              <div className="form-group">
                <label>Image Upload (JPEG, PNG, WEBP)</label>
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setProdImage(e.target.files[0])} />
              </div>
              <button type="submit" className="btn-gold" style={{ marginTop: '12px' }}>Save Product</button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Category Modal */}
      {categoryToDelete && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-backdrop" onClick={closeDeleteCategoryModal}></div>
          <div className="admin-modal-card surface-card" style={{ maxWidth: '400px' }}>
            <div className="admin-modal-header">
              <h3>DELETE CATEGORY</h3>
              <button className="modal-close-btn" onClick={closeDeleteCategoryModal} disabled={deleteCategoryLoading}>
                <X size={18} />
              </button>
            </div>
            
            <div style={{ padding: '20px 0' }}>
              <p style={{ marginBottom: '20px' }}>
                Are you sure you want to delete the category <strong>"{categoryToDelete.name}"</strong>? 
                This action cannot be undone.
              </p>

              {deleteCategoryError && (
                <div className="admin-error-banner" style={{ marginBottom: '20px' }}>
                  <AlertCircle size={16} />
                  <span>{deleteCategoryError}</span>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button 
                  className="btn-outline" 
                  onClick={closeDeleteCategoryModal}
                  disabled={deleteCategoryLoading}
                >
                  Cancel
                </button>
                <button 
                  className="btn-gold" 
                  style={{ background: '#dc3545', borderColor: '#dc3545', color: '#fff' }}
                  onClick={confirmDeleteCategory}
                  disabled={deleteCategoryLoading}
                >
                  {deleteCategoryLoading ? 'Processing...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Permanent Delete Product Modal */}
      {productToDeletePermanently && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-backdrop" onClick={closePermanentDeleteModal}></div>
          <div className="admin-modal-card surface-card" style={{ maxWidth: '450px', borderTop: '4px solid #dc3545' }}>
            <div className="admin-modal-header">
              <h3 style={{ color: '#dc3545', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={20} /> DELETE PRODUCT PERMANENTLY?
              </h3>
              <button className="modal-close-btn" onClick={closePermanentDeleteModal} disabled={productActionLoading}>
                <X size={18} />
              </button>
            </div>
            
            <div style={{ padding: '20px 0' }}>
              <p style={{ marginBottom: '15px' }}>
                This action <strong>cannot be undone</strong>. Permanent deletion is allowed only if this product has never been included in a customer order.
              </p>
              
              <p style={{ marginBottom: '15px', color: '#ccc' }}>
                Type <strong>DELETE</strong> below to confirm.
              </p>
              
              <input 
                type="text" 
                value={deleteTypeConfirmation}
                onChange={(e) => setDeleteTypeConfirmation(e.target.value)}
                placeholder="DELETE"
                style={{ width: '100%', marginBottom: '20px', padding: '10px', background: '#222', border: '1px solid #444', color: '#fff' }}
              />

              {productActionError && (
                <div className="admin-error-banner" style={{ marginBottom: '20px' }}>
                  <AlertCircle size={16} />
                  <span>{productActionError}</span>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button 
                  className="btn-outline" 
                  onClick={closePermanentDeleteModal}
                  disabled={productActionLoading}
                >
                  Cancel
                </button>
                <button 
                  className="btn-gold" 
                  style={{ background: '#dc3545', borderColor: '#dc3545', color: '#fff', opacity: deleteTypeConfirmation !== 'DELETE' ? 0.5 : 1 }}
                  onClick={confirmPermanentDelete}
                  disabled={productActionLoading || deleteTypeConfirmation !== 'DELETE'}
                >
                  {productActionLoading ? 'Processing...' : 'Delete Permanently'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Orders Modal */}
      {deleteAllModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-backdrop" onClick={closeDeleteAllModal}></div>
          <div className="admin-modal-card surface-card" style={{ maxWidth: '450px', borderTop: '4px solid #dc3545' }}>
            <div className="admin-modal-header">
              <h3 style={{ color: '#dc3545', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={20} /> DELETE ALL ORDERS?
              </h3>
              <button className="modal-close-btn" onClick={closeDeleteAllModal} disabled={orderActionLoading}>
                <X size={18} />
              </button>
            </div>
            
            <div style={{ padding: '20px 0' }}>
              <p style={{ marginBottom: '15px', fontWeight: 'bold' }}>
                This will permanently erase all customer orders, order items, invoices, and sales history. This action cannot be undone.
              </p>
              
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label>Admin Password Required</label>
                <input 
                  type="password" 
                  value={deleteAllPassword}
                  onChange={(e) => setDeleteAllPassword(e.target.value)}
                  placeholder="Enter your password"
                  style={{ width: '100%', padding: '10px', background: '#222', border: '1px solid #444', color: '#fff' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label>Type <strong style={{ color: '#dc3545' }}>DELETE ALL ORDERS</strong> to confirm</label>
                <input 
                  type="text" 
                  value={deleteAllConfirmation}
                  onChange={(e) => setDeleteAllConfirmation(e.target.value)}
                  placeholder="DELETE ALL ORDERS"
                  style={{ width: '100%', padding: '10px', background: '#222', border: '1px solid #444', color: '#fff' }}
                />
              </div>

              {orderActionError && (
                <div className="admin-error-banner" style={{ marginBottom: '20px' }}>
                  <AlertCircle size={16} />
                  <span>{orderActionError}</span>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button 
                  className="btn-outline" 
                  onClick={closeDeleteAllModal}
                  disabled={orderActionLoading}
                >
                  Cancel
                </button>
                <button 
                  className="btn-gold" 
                  style={{ background: '#dc3545', borderColor: '#dc3545', color: '#fff', opacity: (deleteAllConfirmation !== 'DELETE ALL ORDERS' || !deleteAllPassword) ? 0.5 : 1 }}
                  onClick={confirmDeleteAllOrders}
                  disabled={orderActionLoading || deleteAllConfirmation !== 'DELETE ALL ORDERS' || !deleteAllPassword}
                >
                  {orderActionLoading ? 'Processing...' : 'Delete Everything'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
