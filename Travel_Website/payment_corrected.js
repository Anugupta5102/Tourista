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

