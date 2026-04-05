// 🌍 GLOBAL FETCH INTERCEPTOR
(function () {
    const originalFetch = window.fetch;

    window.fetch = async function (url, options = {}) {
        const token = localStorage.getItem("token");

        // Inject token automatically
        options.headers = {
            ...(options.headers || {}),
            Authorization: `Bearer ${token}`
        };

        const response = await originalFetch(url, options);

        // 🚨 Handle expired token globally
        if (response.status === 401) {
            let message = "Session expired. Please login again.";

            try {
                const data = await response.clone().json();
                if (data.message) message = data.message;
            } catch {}

            // Show message
            alert(message);

            // Clear token
            localStorage.removeItem("token");

            // Redirect
            window.location.href = "/";

            return Promise.reject(new Error(message));
        }

        return response;
    };
})();