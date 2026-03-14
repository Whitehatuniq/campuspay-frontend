const useRazorpay = () => {
  const loadScript = () => {
    return new Promise((resolve) => {
      if (document.getElementById('razorpay-script')) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.id = 'razorpay-script';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const openPayment = async ({ amount, name, description, onSuccess, onFailure }) => {
    const loaded = await loadScript();
    if (!loaded) {
      alert('Razorpay failed to load. Check your internet connection.');
      return;
    }

    const options = {
      key: 'rzp_test_SR7Ru0idkF4HPl',
      amount: amount * 100, // Razorpay takes amount in paise
      currency: 'INR',
      name: 'CampusPay',
      description: description,
      image: '🎓',
      handler: function (response) {
        onSuccess(response);
      },
      prefill: {
        name: name,
      },
      theme: {
        color: '#38bdf8',
      },
      modal: {
        ondismiss: function () {
          if (onFailure) onFailure('Payment cancelled');
        }
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', function (response) {
      if (onFailure) onFailure(response.error.description);
    });
    rzp.open();
  };

  return { openPayment };
};

export default useRazorpay;
