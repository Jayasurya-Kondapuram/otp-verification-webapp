document.addEventListener("DOMContentLoaded", () => {
    let timerInterval;

    function startOTPTimer(duration = 300) {
        const timerEl = document.getElementById("timer");
        clearInterval(timerInterval);
        let time = duration;

        function updateTimer() {
            const minutes = String(Math.floor(time / 60)).padStart(2, "0");
            const seconds = String(time % 60).padStart(2, "0");
            timerEl.textContent = `OTP expires in ${minutes}:${seconds}`;
            time--;

            if (time < 0) {
                clearInterval(timerInterval);
                timerEl.textContent = "⏰ OTP expired. Please resend.";
            }
        }

        updateTimer();
        timerInterval = setInterval(updateTimer, 1000);
    }

    // ✅ Send OTP
    document.getElementById("send-otp-btn").addEventListener("click", async () => {
        const email = document.getElementById("email").value;
        if (!email) {
            document.getElementById("message").textContent = "Please enter an email!";
            document.getElementById("message").style.color = "red";
            return;
        }

        const response = await fetch("http://localhost:3000/send-otp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email })
        });

        const result = await response.json();
        if (response.ok) {
            document.getElementById("message").textContent = "OTP sent! Check your email.";
            document.getElementById("message").style.color = "#3333cc";
            document.getElementById("email-form").style.display = "none";
            document.getElementById("otp-form").style.display = "block";
            document.getElementById("tick-animation").style.display = "none";
            startOTPTimer();
        } else {
            document.getElementById("message").textContent = result.error || "Failed to send OTP.";
            document.getElementById("message").style.color = "red";
        }
    });

    // ✅ Verify OTP
    document.getElementById("verify-otp-btn").addEventListener("click", async () => {
        const email = document.getElementById("email").value;
        const otp = document.getElementById("otp").value;

        document.getElementById("otp").setAttribute("readonly", true);

        if (!otp || otp.length !== 6) {
            document.getElementById("message").textContent = "Enter a valid 6-digit OTP!";
            document.getElementById("message").style.color = "red";
            return;
        }

        const response = await fetch("http://localhost:3000/verify-otp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, otp })
        });

        const result = await response.json();
        if (response.ok) {
            document.getElementById("message").textContent = "✅ OTP Verified!";
            document.getElementById("message").style.color = "#4CAF50";
            document.getElementById("tick-animation").style.display = "block";
            document.getElementById("otp-form").style.display = "none";
            clearInterval(timerInterval);
        } else {
            document.getElementById("message").textContent = result.error || "Invalid OTP!";
            document.getElementById("message").style.color = "red";
            document.getElementById("otp").removeAttribute("readonly");
            document.getElementById("tick-animation").style.display = "none";
        }
    });

    // ✅ Resend OTP
    document.getElementById("resend-otp-btn").addEventListener("click", async () => {
        const email = document.getElementById("email").value;
        if (!email) {
            document.getElementById("message").textContent = "Enter your email again to resend OTP.";
            document.getElementById("message").style.color = "red";
            return;
        }

        const response = await fetch("http://localhost:3000/send-otp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email })
        });

        const result = await response.json();
        if (response.ok) {
            document.getElementById("message").textContent = "New OTP sent! Check your email.";
            document.getElementById("message").style.color = "#00e676";
            document.getElementById("otp").removeAttribute("readonly");
            document.getElementById("otp").value = "";
            document.getElementById("tick-animation").style.display = "none";
            startOTPTimer();
        } else {
            document.getElementById("message").textContent = result.error || "Failed to resend OTP.";
            document.getElementById("message").style.color = "red";
        }
    });
});
