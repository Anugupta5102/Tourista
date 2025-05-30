const validateCard = (card) => {
  if (!/^\d{16}$/.test(card.number)) return false;
  if (!/^(0[1-9]|1[0-2])\/?([0-9]{2})$/.test(card.expiry)) return false;
  if (!/^\d{3,4}$/.test(card.cvv)) return false;
  return true;
};

export const processPayment = async (paymentData) => {
  if (!validateCard(paymentData)) {
    throw new Error('Invalid card details');
  }

  const response = await fetch('/api/payments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content
    },
    body: JSON.stringify(paymentData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Payment failed');
  }

  return await response.json();
};
