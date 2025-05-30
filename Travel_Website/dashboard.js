document.addEventListener('DOMContentLoaded', async () => {
  // Check authentication
  const response = await fetch('/api/auth/verify-session', {
    credentials: 'include'
  });
  const authData = await response.json();

  if (!authData.authenticated) {
    window.location.href = 'login.html';
    return;
  }

  // Load appropriate dashboard based on role
  if (authData.user.role === 'admin' && !window.location.pathname.includes('admin-dashboard')) {
    window.location.href = 'admin-dashboard.html';
    return;
  } else if (authData.user.role === 'user' && !window.location.pathname.includes('user-dashboard')) {
    window.location.href = 'user-dashboard.html';
    return;
  }

  try {
    // Load dashboard data
    const dashboardResponse = await fetch('/api/dashboard', {
      credentials: 'include'
    });
    
    if (!dashboardResponse.ok) throw new Error('Failed to load dashboard data');
    
    const dashboardData = await dashboardResponse.json();

    // Render dashboard based on role
    if (authData.user.role === 'admin') {
      renderAdminDashboard(dashboardData);
    } else {
      renderUserDashboard(dashboardData, authData.user);
    }
  } catch (error) {
    console.error('Dashboard error:', error);
    alert('Failed to load dashboard data. Please try again.');
  }

  // Logout handler
  document.getElementById('logout-btn')?.addEventListener('click', async () => {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });
    window.location.href = 'index.html';
  });
});

function renderUserDashboard(data, user) {
  // Render user profile
  const profileHtml = `
    <div class="text-center">
      <div class="user-profile-img bg-secondary d-flex align-items-center justify-content-center mx-auto mb-3">
        <span class="text-white fs-4">${user.username.charAt(0).toUpperCase()}</span>
      </div>
      <h4>${user.username}</h4>
      <p class="text-muted">${user.email}</p>
    </div>
  `;
  document.getElementById('user-profile').innerHTML = profileHtml;

  // Render recent bookings
  let bookingsHtml = '';
  if (data.recentBookings && data.recentBookings.length > 0) {
    data.recentBookings.forEach(booking => {
      bookingsHtml += `
        <div class="booking-card">
          <h6>${booking.package.name}</h6>
          <p>Travel Date: ${new Date(booking.travelDate).toLocaleDateString()}</p>
          <span class="badge ${getStatusBadgeClass(booking.status)}">${booking.status}</span>
        </div>
      `;
    });
  } else {
    bookingsHtml = '<p>No recent bookings found</p>';
  }
  document.getElementById('recent-bookings').innerHTML = bookingsHtml;

  // Render recent payments
  let paymentsHtml = '';
  if (data.recentPayments && data.recentPayments.length > 0) {
    data.recentPayments.forEach(payment => {
      paymentsHtml += `
        <div class="payment-card">
          <h6>$${payment.amount.toFixed(2)}</h6>
          <p>Date: ${new Date(payment.paymentDate).toLocaleDateString()}</p>
          <span class="badge ${getStatusBadgeClass(payment.status)}">${payment.status}</span>
        </div>
      `;
    });
  } else {
    paymentsHtml = '<p>No recent payments found</p>';
  }
  document.getElementById('recent-payments').innerHTML = paymentsHtml;
}

function renderAdminDashboard(data) {
  // Render stats
  document.getElementById('total-users').textContent = data.stats.totalUsers;
  document.getElementById('total-bookings').textContent = data.stats.totalBookings;
  document.getElementById('total-payments').textContent = data.stats.totalPayments;

  // Initialize DataTables
  $('#recent-bookings-table').DataTable({
    data: data.recentBookings,
    columns: [
      { data: 'user.name' },
      { data: 'package.name' },
      { 
        data: 'travelDate',
        render: function(data) {
          return new Date(data).toLocaleDateString();
        }
      },
      { 
        data: 'status',
        render: function(data) {
          return `<span class="badge ${getStatusBadgeClass(data)}">${data}</span>`;
        }
      }
    ]
  });

  $('#recent-payments-table').DataTable({
    data: data.recentPayments,
    columns: [
      { data: 'user.name' },
      { 
        data: 'amount',
        render: function(data) {
          return `$${data.toFixed(2)}`;
        }
      },
      { 
        data: 'paymentDate',
        render: function(data) {
          return new Date(data).toLocaleDateString();
        }
      },
      { 
        data: 'status',
        render: function(data) {
          return `<span class="badge ${getStatusBadgeClass(data)}">${data}</span>`;
        }
      }
    ]
  });
}

function getStatusBadgeClass(status) {
  switch(status.toLowerCase()) {
    case 'confirmed':
    case 'completed':
    case 'paid':
      return 'bg-success';
    case 'pending':
      return 'bg-warning text-dark';
    case 'cancelled':
    case 'failed':
      return 'bg-danger';
    default:
      return 'bg-secondary';
  }
}
