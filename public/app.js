document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('loginForm');
    const submitBtn = document.getElementById('submitBtn');
    const btnText = submitBtn.querySelector('.btn-text');
    const spinner = submitBtn.querySelector('.spinner');
    const verificationBadge = document.getElementById('verificationResult');
    const badgeText = verificationBadge.querySelector('.text');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // 1. Set Loading State
        submitBtn.disabled = true;
        btnText.classList.add('hidden');
        spinner.classList.remove('hidden');
        
        // Hide previous badge if exists
        verificationBadge.className = 'verification-badge hidden';

        // 2. Gather Data
        const formData = new FormData(form);
        const name = formData.get('name');
        const phone = formData.get('phone');
        
        const payload = {
            country: formData.get('country'),
            address: {
                street: formData.get('street'),
                city: formData.get('city'),
                state: formData.get('state'),
                pincode: formData.get('pincode')
            }
        };

        try {
            // 3. Call API
            const response = await fetch('/api/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            // 4. Update UI based on Address Validity
            verificationBadge.classList.remove('hidden', 'valid', 'invalid');
            
            // Check API response format (assuming it has isVerified or verified property based on standard API practices)
            const isVerified = result.isVerified || result.verified || result.success === true;
            
            if (isVerified) {
                verificationBadge.classList.add('valid');
                badgeText.textContent = 'Address Verified Successfully';
            } else {
                verificationBadge.classList.add('invalid');
                badgeText.textContent = 'Invalid or Unrecognized Address';
            }
            
            // 5. Continue Login Process as Requested
            setTimeout(() => {
                alert(`Login successful for ${name}! Phone: ${phone}\n(This is a simulated successful login as requested, regardless of address validity)`);
                // Reset form or redirect user here in a real app
                // form.reset();
                // window.location.href = '/dashboard';
            }, 800);

        } catch (error) {
            console.error('Error verifying address:', error);
            verificationBadge.classList.remove('hidden');
            verificationBadge.classList.add('invalid');
            badgeText.textContent = 'Error communicating with server';
        } finally {
            // Restore button state
            submitBtn.disabled = false;
            btnText.classList.remove('hidden');
            spinner.classList.add('hidden');
            // Re-show button text (wait a bit so badge animation plays first)
        }
    });
});
