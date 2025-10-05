// Notification System Manager
class NotificationManager {
    constructor() {
        this.notifications = [];
        this.maxNotifications = 5;
    }

    showNotification(message, type = 'info', duration = 5000) {
        const notification = this.createNotificationElement(message, type);
        this.addNotificationToDOM(notification);
        
        // Auto remove after duration
        setTimeout(() => {
            this.removeNotification(notification);
        }, duration);

        // Store reference
        this.notifications.push(notification);
        
        // Limit number of notifications
        if (this.notifications.length > this.maxNotifications) {
            const oldest = this.notifications.shift();
            this.removeNotification(oldest);
        }
    }

    createNotificationElement(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${this.getIconForType(type)}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Add click to close
        notification.addEventListener('click', (e) => {
            if (e.target.closest('.notification-close')) {
                this.removeNotification(notification);
            }
        });

        return notification;
    }

    addNotificationToDOM(notification) {
        let container = document.getElementById('notification-container');
        
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            container.className = 'notification-container';
            document.body.appendChild(container);
        }

        container.appendChild(notification);
        
        // Trigger animation
        requestAnimationFrame(() => {
            notification.classList.add('show');
        });
    }

    removeNotification(notification) {
        if (notification && notification.parentElement) {
            notification.classList.add('hide');
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
                // Remove from array
                const index = this.notifications.indexOf(notification);
                if (index > -1) {
                    this.notifications.splice(index, 1);
                }
            }, 300);
        }
    }

    getIconForType(type) {
        const icons = {
            'info': 'info-circle',
            'success': 'check-circle',
            'warning': 'exclamation-triangle',
            'error': 'times-circle',
            'loading': 'spinner'
        };
        return icons[type] || 'info-circle';
    }

    showLoadingState(message = 'Loading...') {
        return this.showNotification(message, 'loading', 0); // 0 = no auto-remove
    }

    hideLoadingState() {
        // Remove all loading notifications
        const loadingNotifications = document.querySelectorAll('.notification-loading');
        loadingNotifications.forEach(notification => {
            this.removeNotification(notification);
        });
    }

    clearAll() {
        this.notifications.forEach(notification => {
            this.removeNotification(notification);
        });
    }
}
