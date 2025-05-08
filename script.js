document.addEventListener('DOMContentLoaded', function() {
    const trackingNumberInput = document.getElementById('tracking-number');
    const searchButton = document.getElementById('search-button');
    const copyUrlButton = document.getElementById('copy-url-button');
    const pasteButton = document.getElementById('paste-button');
    const clearInput = document.getElementById('clear-input');
    const trackingContainer = document.getElementById('tracking-container');
    const trackingStatus = document.getElementById('tracking-status');
    const deliveryPerson = document.getElementById('delivery-person');
    const trackingTimeline = document.getElementById('tracking-timeline');
    const loader = document.getElementById('loader');
    const errorMessage = document.getElementById('error-message');

    
    
    // Kiểm tra tham số URL khi tải trang
    const urlParams = new URLSearchParams(window.location.search);
    const initialTrackingNumber = urlParams.get('spx_tn');
    if (initialTrackingNumber) {
        trackingNumberInput.value = initialTrackingNumber;
        clearInput.style.display = 'block';
        searchTracking();
    }

    // Hiển thị/ẩn nút xóa khi có nội dung
    trackingNumberInput.addEventListener('input', function() {
        clearInput.style.display = this.value ? 'block' : 'none';
    });

    // Xử lý nút xóa
    clearInput.addEventListener('click', function() {
        trackingNumberInput.value = '';
        clearInput.style.display = 'none';
        trackingNumberInput.focus();
        errorMessage.style.display = 'none';
        trackingContainer.style.display = 'none';
        // Xóa tham số URL
        const newUrl = new URL(window.location);
        newUrl.searchParams.delete('spx_tn');
        window.history.pushState({}, '', newUrl);
    });

    // Sự kiện cho nút tìm kiếm
    searchButton.addEventListener('click', function() {
        searchTracking();
    });

    // Sự kiện cho nút copy URL
    copyUrlButton.addEventListener('click', function() {
        const trackingNumber = trackingNumberInput.value.trim();
        if (!trackingNumber) {
            showError('Vui lòng nhập mã vận đơn trước khi sao chép URL.');
            return;
        }

        const newUrl = new URL(window.location);
        newUrl.searchParams.set('spx_tn', trackingNumber);

        navigator.clipboard.writeText(newUrl.toString())
            .then(() => {
                copyUrlButton.textContent = 'Đã sao chép';
                copyUrlButton.classList.remove('btn-secondary');
                copyUrlButton.classList.add('btn-success');

                setTimeout(() => {
                    copyUrlButton.textContent = 'Copy URL';
                    copyUrlButton.classList.remove('btn-success');
                    copyUrlButton.classList.add('btn-secondary');
                }, 1500);
            })
            .catch(err => {
                showError('Không thể sao chép URL. Vui lòng thử lại.');
                console.error('Copy error:', err);
            });
    });

    pasteButton.addEventListener('click', function() {
        // Kiểm tra nếu trình duyệt hỗ trợ Clipboard API
        if (!navigator.clipboard) {
            showError('Trình duyệt không hỗ trợ đọc clipboard. Vui lòng dán thủ công (Ctrl+V).');
            console.error('Clipboard API không được hỗ trợ. Hãy chạy trên HTTPS hoặc localhost.');
            return;
        }
    
        // Thử đọc clipboard
        navigator.clipboard.readText()
            .then(text => {
                if (text) {
                    trackingNumberInput.value = text.trim();
                    clearInput.style.display = 'block'; // Hiển thị nút xóa
                    errorMessage.style.display = 'none'; // Ẩn thông báo lỗi nếu có
                    trackingContainer.style.display = 'none'; // Ẩn container kết quả
                    // trackingNumberInput.focus(); // Focus lại vào input sau khi dán
                    searchTracking();
                } else {
                    showError('Clipboard trống. Vui lòng sao chép nội dung trước.');
                }
            })
            .catch(err => {
                // Xử lý lỗi clipboard, đặc biệt cho Safari
                showError('Không thể đọc clipboard tự động. Vui lòng dán thủ công bằng cách nhấn Ctrl+V hoặc chạm và giữ để dán.');
                console.error('Clipboard read error:', err);
    
                // Thử mở hộp thoại dán thủ công trên Safari
                trackingNumberInput.select();
                try {
                    document.execCommand('paste'); // Phương thức dự phòng cho Safari
                } catch (e) {
                    console.error('Manual paste failed:', e);
                }
            });
    });

    // Sự kiện khi nhấn Enter trong ô input
    trackingNumberInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchTracking();
        }
    });

    function searchTracking() {
        const trackingNumber = trackingNumberInput.value.trim();
        
        if (!trackingNumber) {
            errorMessage.style.display = 'block';
            return;
        }

        const newUrl = new URL(window.location);
        newUrl.searchParams.set('spx_tn', trackingNumber);
        window.history.pushState({}, '', newUrl);

        errorMessage.style.display = 'none';
        loader.style.display = 'block';
        trackingContainer.style.display = 'none';
        
        const apiUrl = `/api/tracking?spx_tn=${trackingNumber}`;
        
        fetch(apiUrl)
            .then(response => response.json())
            .then(data => {
                loader.style.display = 'none';
                
                if (data.retcode !== 0 || !data.data || !data.data.sls_tracking_info) {
                    showError('Không tìm thấy thông tin vận đơn. Vui lòng kiểm tra lại mã vận đơn.');
                    return;
                }
                
                displayTrackingInfo(data.data);
            })
            .catch(error => {
                loader.style.display = 'none';
                showError('Đã xảy ra lỗi khi tìm kiếm. Vui lòng thử lại sau.');
                console.error('Error:', error);
            });
    }

    function displayTrackingInfo(data) {
        const trackingInfo = data.sls_tracking_info;
        const records = trackingInfo.records;
        
        if (!records || records.length === 0) {
            showError('Không có thông tin lịch sử vận chuyển.');
            return;
        }
        
        trackingTimeline.innerHTML = '';
        records.sort((a, b) => b.actual_time - a.actual_time);
        const latestRecord = records[0];
        
        let statusClass = 'status-transit';
        let statusText = '';
        
        if (latestRecord.milestone_code === 8) {
            statusClass = 'status-delivered';
            statusText = 'Đã giao hàng thành công';
        } else if (latestRecord.milestone_code === 9) {
            statusClass = 'status-cancelled';
            statusText = 'Đơn hàng đã bị hủy';
        } else if (latestRecord.milestone_code === 10) {
            statusClass = 'status-returned';
            statusText = 'Đơn hàng đã bị hoàn';
        }else if (latestRecord.milestone_code === 1 && latestRecord.tracking_code === "F001") {
            statusClass = 'status-pickup-failed';
            statusText = 'Shipper lấy hàng không thành công ';
        } else {
            statusText = 'Đang vận chuyển';
        }
        
        trackingStatus.textContent = statusText;
        trackingStatus.className = 'tracking-status ' + statusClass;
        
        const deliveryPersonName = findDeliveryPerson(records);
        if (deliveryPersonName) {
            deliveryPerson.textContent = `Tên người giao: ${deliveryPersonName}`;
            deliveryPerson.style.display = 'block';
        } else {
            deliveryPerson.style.display = 'none';
        }
        
        records.forEach(record => {
            if (record.display_flag === 1 || record.display_flag  === 0) {
                const trackingItem = document.createElement('div');
                trackingItem.className = 'tracking-item';
                
                const date = new Date(record.actual_time * 1000);
                const formattedTime = formatTime(date);
                const formattedDate = formatDate(date);
                
                trackingItem.innerHTML = `
                    <div class="tracking-date">${formattedTime}<br>${formattedDate}</div>
                    <div class="tracking-description">${record.description}</div>
                `;
                
                trackingTimeline.appendChild(trackingItem);
            }
        });
        
        trackingContainer.style.display = 'block';
    }
    
    function findDeliveryPerson(records) {
        for (const record of records) {
            if (record.operator && record.operator.trim() !== '' && record.operator !== 'OMS') {
                return record.operator;
            }
        }
        return null;
    }
    
    function formatTime(date) {
        return date.toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
    }
    
    function formatDate(date) {
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    }
    
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.color = '#dc3545';
        errorMessage.style.display = 'block';
    }
    
    document.getElementById('find-number-search').addEventListener('click', async () => {
        // const carrier = document.getElementById('carrier').value;
        // const prefix = document.getElementById('prefix').value;
        const phoneNumber = document.getElementById('phone-number').value;
        const resultDiv = document.getElementById('find-number-result');
        const loader = document.getElementById('find-number-loader');

        // Validation: only carrier is required
        // if (!carrier) {
        //     resultDiv.className = 'alert alert-danger';
        //     resultDiv.textContent = 'Vui lòng chọn nhà mạng.';
        //     resultDiv.style.display = 'block';
        //     return;
        // }

        // Validate numeric input if fields are not empty
        // if (prefix && !/^\d+$/.test(prefix)) {
        //     resultDiv.className = 'alert alert-danger';
        //     resultDiv.textContent = 'Đầu số chỉ được chứa số.';
        //     resultDiv.style.display = 'block';
        //     return;
        // }
        if (phoneNumber && !/^\d+$/.test(phoneNumber)) {
            resultDiv.className = 'alert alert-danger';
            resultDiv.textContent = 'Số điện thoại chỉ được chứa số.';
            resultDiv.style.display = 'block';
            return;
        }

        // Show loader
        loader.style.display = 'block';
        resultDiv.style.display = 'none';

        try {
            // Replace with your actual API endpoint
            const response = await fetch('/api/find-number', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({  phoneNumber }),
                // body: JSON.stringify({ carrier, prefix, phoneNumber }),
            });

            const data = await response.json();

            // Hide loader
            loader.style.display = 'none';

            if (data.success) {
                resultDiv.className = 'alert alert-success';
                resultDiv.innerHTML = `
                    Phone: <span id="phone-number-result">${data.data.phone}</span>
                    <button class="btn btn-primary btn-sm copy-button" id="copy-phone-button">Copy</button>
                `;
                resultDiv.style.display = 'block';

                // Add event listener for copy button
                document.getElementById('copy-phone-button').addEventListener('click', () => {
                    const phoneNumber = document.getElementById('phone-number-result').textContent;
                    navigator.clipboard.writeText(phoneNumber)
                        .then(() => {
                            // Provide feedback (e.g., change button text temporarily)
                            const button = document.getElementById('copy-phone-button');
                            button.textContent = 'Đã copy!';
                            setTimeout(() => {
                                button.textContent = 'Copy';
                            }, 2000);
                        })
                        .catch(err => {
                            console.error('Failed to copy:', err);
                            resultDiv.className = 'alert alert-danger';
                            resultDiv.textContent = 'Không thể sao chép số điện thoại.';
                            resultDiv.style.display = 'block';
                        });
                });
            } else {
                resultDiv.className = 'alert alert-danger';
                resultDiv.textContent = data.message || 'Tìm kiếm thất bại.';
                resultDiv.style.display = 'block';
            }
        } catch (error) {
            // Hide loader
            loader.style.display = 'none';

            // Display error
            resultDiv.className = 'alert alert-danger';
            resultDiv.textContent = 'Đã có lỗi xảy ra. Vui lòng thử lại.';
            resultDiv.style.display = 'block';
        }
    });

    // Clear result when modal is closed
    document.getElementById('findNumberModal').addEventListener('hidden.bs.modal', () => {
        document.getElementById('carrier').value = 'VNMB';
        document.getElementById('prefix').value = '';
        document.getElementById('phone-number').value = '';
        document.getElementById('find-number-result').style.display = 'none';
        document.getElementById('find-number-loader').style.display = 'none';
    });
});