// Load Stripe.js
const stripe = Stripe('pk_test_your_publishable_key');
let elements;

function initializeStripe() {
  const appearance = {
    theme: 'stripe',
    variables: {
      colorPrimary: '#6772e5',
    }
  };
  elements = stripe.elements({ appearance });
  const cardElement = elements.create('card');
  cardElement.mount('#card-element');
}

// Function to check if all form fields are filled
function checkFormValidity() {
    const form = document.querySelector('form');
    const inputs = form.querySelectorAll('input, select');
    let isValid = true;

    inputs.forEach(input => {
        if (!input.checkValidity()) {
            isValid = false;
        }
    });

    return isValid;
}

// Add event listener to the form submit event
const form = document.querySelector('form');
const checkoutButton = document.querySelector('.btn-primary');

form.addEventListener('submit', async function (event) {
    event.preventDefault();
    
    if (!checkFormValidity()) {
        alert('Please fill out all required fields.');
        return;
    }

    // Create payment intent on server
    const { error: backendError, clientSecret } = await fetch('/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content
      },
      body: JSON.stringify({
        amount: totalCost * 100, // Convert to cents
        currency: 'inr',
        metadata: {
          package: selectedPackage,
          userId: localStorage.getItem('userId')
        }
      })
    }).then(r => r.json());

    if (backendError) {
      throw new Error(backendError.message);
    }

    // Confirm payment with Stripe
    const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
      clientSecret,
      {
        payment_method: {
          card: elements.getElement('card'),
          billing_details: {
            name: `${firstNameInput.value} ${lastNameInput.value}`,
            address: {
              line1: addressInput.value,
              postal_code: zipInput.value
            }
          }
        }
      }
    );

    if (stripeError) {
      throw stripeError;
    }

    // Save booking to database
    const bookingData = {
      package: selectedPackage,
      amount: totalCost,
      paymentMethod: 'card',
      paymentStatus: paymentIntent.status,
      transactionId: paymentIntent.id,
      userDetails: {
        firstName: firstNameInput.value,
        lastName: lastNameInput.value,
        email: emailInput.value,
        address: addressInput.value,
        zip: zipInput.value
      }
    };

    const response = await fetch('/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content
      },
      body: JSON.stringify(bookingData)
    });

    const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.message || 'Payment processing failed');
        }

        // Store booking details before redirect
        localStorage.setItem('lastBooking', JSON.stringify(result));
        window.location.href = `/booking-confirmation.html?bookingId=${result._id}`;
        
    } catch (error) {
        console.error('Error:', error);
        
        // Enhanced error display
        const errorContainer = document.getElementById('error-message');
        if (errorContainer) {
            errorContainer.textContent = error.message;
            errorContainer.style.display = 'block';
        } else {
            alert(`Payment failed: ${error.message}`);
        }
    } finally {
        // Reset button state
        checkoutButton.disabled = false;
        checkoutButton.textContent = 'Place Order';
    }
});

const firstNameInput = document.getElementById('firstName');
const lastNameInput = document.getElementById('lastName');

// Regular expression to validate alphabet characters only
const alphabetRegex = /^[A-Za-z]+$/;

firstNameInput.addEventListener('blur', function () {
    const value = this.value.trim();
    if (!alphabetRegex.test(value)) {
        this.setCustomValidity('Please enter a valid first name using only alphabet characters.');
        this.classList.add('is-invalid');
    } else {
        this.setCustomValidity('');
        this.classList.remove('is-invalid');
    }
});

lastNameInput.addEventListener('blur', function () {
    const value = this.value.trim();
    if (!alphabetRegex.test(value)) {
        this.setCustomValidity('Please enter a valid last name using only alphabet characters.');
        this.classList.add('is-invalid');
    } else {
        this.setCustomValidity('');
        this.classList.remove('is-invalid');
    }
});

const usernameInput = document.getElementById('username');

// Regular expression to validate username (letters and digits only)
const usernameRegex = /^[a-zA-Z0-9]+$/;

usernameInput.addEventListener('blur', function () {
    const value = this.value.trim();
    if (!usernameRegex.test(value)) {
        this.setCustomValidity('Your username should only contain letters and digits.');
        this.classList.add('is-invalid');
    } else {
        this.setCustomValidity('');
        this.classList.remove('is-invalid');
    }
});

// Add event listener to the form input event
form.addEventListener('input', function () {
    if (checkFormValidity()) {
        checkoutButton.removeAttribute('disabled');
    } else {
        checkoutButton.setAttribute('disabled', 'true');
    }
});

// Initialize Stripe when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  initializeStripe();
  
  // Existing DOMContentLoaded code...

// Add event listener to the Zipcode input for validation
const zipInput = document.getElementById('zip');

zipInput.addEventListener('blur', function () {
    const value = this.value.trim();
    const isValidZip = /^\d{1,6}$/.test(value); // Check if value contains only digits and is up to 6 digits long
    if (!isValidZip) {
        this.setCustomValidity('Please enter a valid Zipcode.'); // Set custom validation message
        this.classList.add('is-invalid'); // Add Bootstrap invalid class
    } else {
        this.setCustomValidity(''); // Clear custom validation message if valid
        this.classList.remove('is-invalid'); // Remove Bootstrap invalid class
    }
});


// Add event listener to the email input for validation
const emailInput = document.getElementById('email');

emailInput.addEventListener('blur', function () {
    const email = this.value.trim(); // Trim whitespace from the input
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); // Use regular expression to validate email format

    if (!isValidEmail) {
        this.classList.add('is-invalid'); // Add 'is-invalid' class to input for visual feedback
        this.nextElementSibling.style.display = 'block'; // Show the invalid feedback message
    } else {
        this.classList.remove('is-invalid'); // Remove 'is-invalid' class
        this.nextElementSibling.style.display = 'none'; // Hide the invalid feedback message
    }
});

const addressInput = document.getElementById('address');

addressInput.addEventListener('blur', validateAddress);

function validateAddress() {
    const input = this;
    const value = input.value.trim();
    const isValid = value !== '';

    if (!isValid) {
        input.setCustomValidity('Please enter your shipping address.');
        input.classList.add('is-invalid');
    } else {
        input.setCustomValidity('Please enter your shipping address.');
        input.classList.remove('is-invalid');
    }
}


//Selected Package Rate
  function getQueryParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
  }

  const selectedPackage = getQueryParam("package");

  let packageCost;
  let briefDescription;
  switch (selectedPackage) {
    case "basic":
      packageCost = 15000; 
      briefDescription = "Basic Package "; 
      break;
    case "premium":
      packageCost = 20000; 
      briefDescription = "Premium Package"; 
      break;
    case "ultimate":
      packageCost = 25000; 
      briefDescription = "Ultimate Package"; 
      break;
    default:
      packageCost = 15000; 
      briefDescription = "Package Not Selected"; 
  }

  document.getElementById("package-cost").textContent = packageCost + "/-";

  document.getElementById("brief-description").textContent = briefDescription;

  const promoCodeDiscount = 1000; 
  const totalCost = packageCost - promoCodeDiscount;
  document.getElementById("total-cost").textContent = totalCost + "/-";
  
/*Free And express Delivary Code starts here*/

document.addEventListener("DOMContentLoaded", function () {
    const shippingSelect = document.getElementById("shipping-method");
    const totalSpan = document.querySelector(".list-group-item strong");
    const listGroup = document.querySelector(".list-group");
  
    // This is the Function to update the shipping cost
    function updateShippingCost() {
      const selectedOption = shippingSelect.value;
      let shippingCost = 0;
  
      if (selectedOption === "standard") {
        shippingCost = 0;
      } else if (selectedOption === "express") {
        shippingCost = 85;
      }
  
      // This is function to remove existing shipping cost item
      const existingShippingItem = document.getElementById("shipping-cost-item");
      if (existingShippingItem) {
        existingShippingItem.remove();
      }
  
      // This is the function to create new shipping cost item
      const shippingItem = document.createElement("li");
      shippingItem.classList.add("list-group-item", "d-flex", "justify-content-between", "text-secondary");
      shippingItem.id = "shipping-cost-item";
      shippingItem.innerHTML = `
        <span>Shipping</span>
        <strong>${shippingCost === 0 ? "Free" : shippingCost + " INR"}</strong>
      `;
  
      // Here is the function to insert new shipping cost item before the total
      listGroup.insertBefore(shippingItem, totalSpan.parentNode);
  
      // To Update the total amount in the cart
      const totalAmount = totalCost + shippingCost; //imagine total amount is 14000 INR
      totalSpan.textContent = `${totalAmount} INR`;
    }
  
    shippingSelect.addEventListener("change", updateShippingCost);
  
    updateShippingCost();
  });
//   adding dark mode feature
  // payment.js or add in a <script> tag at the end of the body
document.addEventListener('DOMContentLoaded', () => {
    const toggleCheckbox = document.getElementById('themeToggle');
    const body = document.body;
  
    // Load saved dark mode preference from localStorage
    if (localStorage.getItem('dark-mode') === 'enabled') {
      body.classList.add('dark-mode');
      toggleCheckbox.checked = true;
    } else {
      toggleCheckbox.checked = false;
    }
  
    toggleCheckbox.addEventListener('change', () => {
      if (toggleCheckbox.checked) {
        body.classList.add('dark-mode');
        localStorage.setItem('dark-mode', 'enabled');
      } else {
        body.classList.remove('dark-mode');
        localStorage.setItem('dark-mode', 'disabled');
      }
    });
  });
  
  