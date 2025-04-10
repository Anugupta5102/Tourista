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

// Form submission handler
const form = document.querySelector('form');
const checkoutButton = document.querySelector('.btn-primary');

form.addEventListener('submit', async function(event) {
    event.preventDefault();
    
    if (!checkFormValidity()) {
        alert('Please fill out all required fields.');
        return;
    }

    try {
        // Payment intent creation
        const { error: backendError, clientSecret } = await fetch('/create-payment-intent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content
            },
            body: JSON.stringify({
                amount: totalCost * 100,
                currency: 'inr',
                metadata: {
                    package: selectedPackage,
                    userId: localStorage.getItem('userId')
                }
            })
        }).then(r => r.json());

        if (backendError) throw new Error(backendError.message);

        // Confirm payment
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

        if (stripeError) throw stripeError;

        // Save booking
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
        if (!response.ok) throw new Error(result.message);
        
        // Redirect on success
        localStorage.setItem('lastBooking', JSON.stringify(result));
        window.location.href = `/booking-confirmation.html?bookingId=${result._id}`;
        
    } catch (error) {
        console.error('Error:', error);
        const errorContainer = document.getElementById('error-message');
        if (errorContainer) {
            errorContainer.textContent = error.message;
            errorContainer.style.display = 'block';
        } else {
            alert(`Payment failed: ${error.message}`);
        }
    } finally {
        checkoutButton.disabled = false;
        checkoutButton.textContent = 'Place Order';
    }
});

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeStripe();
    
    // Form validation initialization
    const firstNameInput = document.getElementById('firstName');
    const lastNameInput = document.getElementById('lastName');
    
    // [Rest of your initialization code...]
});
