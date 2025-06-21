// Placement Prediction System
class PlacementPredictor {
    constructor() {
        this.initializeEventListeners();
        this.updateCGPADisplay();
        this.isLoading = false;
    }

    initializeEventListeners() {
        // Form submission
        document.getElementById('predictionForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handlePrediction();
        });

        // CGPA input updates
        document.getElementById('cgpa').addEventListener('input', () => {
            this.updateCGPADisplay();
        });
    }

    updateCGPADisplay() {
        const cgpaInput = document.getElementById('cgpa');
        const cgpaValue = document.getElementById('cgpaValue');
        const value = parseFloat(cgpaInput.value) || 0;
        cgpaValue.textContent = value.toFixed(1);
        
        // Update color based on CGPA value
        if (value >= 8.5) {
            cgpaValue.style.background = 'linear-gradient(135deg, #10b981, #059669)';
        } else if (value >= 7.0) {
            cgpaValue.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
        } else if (value >= 6.0) {
            cgpaValue.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
        } else {
            cgpaValue.style.background = 'linear-gradient(135deg, #4f46e5, #6366f1)';
        }
    }

    async handlePrediction() {
        if (this.isLoading) return;
        
        const formData = this.getFormData();
        
        if (!this.validateInput(formData)) {
            this.showError('Please enter a valid CGPA between 5.0 and 10.0');
            return;
        }

        this.setLoadingState(true);
        
        try {
            const prediction = await this.predict(formData.cgpa, formData.backlogs);
            this.displayResult(formData, prediction);
        } catch (error) {
            this.showError(`Prediction failed: ${error.message}`);
            console.error('Prediction error:', error);
        } finally {
            this.setLoadingState(false);
        }
    }

    getFormData() {
        const cgpa = parseFloat(document.getElementById('cgpa').value);
        const backlogs = parseInt(document.querySelector('input[name="backlogs"]:checked').value);
        
        return { cgpa, backlogs };
    }

    validateInput(formData) {
        return formData.cgpa >= 5.0 && formData.cgpa <= 10.0 && 
               (formData.backlogs === 0 || formData.backlogs === 1);
    }

    async predict(cgpa, backlogs) {
        try {
            const response = await fetch('http://127.0.0.1:5000/api/predict', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    cgpa: cgpa,
                    history_of_backlogs: backlogs
                })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || `HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            return {
                probability: Math.round(result.probability * 100),
                prediction: result.prediction,
                confidence: result.confidence
            };
            
        } catch (error) {
            console.error('Prediction error:', error);
            throw error;
        }
    }

    displayResult(formData, prediction) {
        const resultSection = document.getElementById('result');
        const resultIcon = document.getElementById('resultIcon');
        const probabilityText = document.getElementById('probabilityText');
        const probabilityCircle = document.getElementById('probabilityCircle');
        const probabilityLabel = document.getElementById('probabilityLabel');
        const resultCGPA = document.getElementById('resultCGPA');
        const resultBacklogs = document.getElementById('resultBacklogs');
        const resultPrediction = document.getElementById('resultPrediction');
        const recommendationList = document.getElementById('recommendationList');

        // Update probability circle
        const percentage = prediction.probability;
        const rotation = (percentage / 100) * 360;
        probabilityCircle.style.background = `conic-gradient(
            ${prediction.prediction === 1 ? '#10b981' : '#ef4444'} ${rotation}deg, 
            #e5e7eb ${rotation}deg
        )`;
        
        probabilityText.textContent = `${percentage}%`;
        
        // Update result details
        resultCGPA.textContent = formData.cgpa.toFixed(1);
        resultBacklogs.textContent = formData.backlogs === 0 ? 'No' : 'Yes';
        
        if (prediction.prediction === 1) {
            resultIcon.className = 'result-icon success';
            resultIcon.innerHTML = '<i class="fas fa-trophy"></i>';
            resultPrediction.textContent = 'Likely to be Placed';
            resultPrediction.style.color = '#10b981';
            probabilityLabel.textContent = 'Placement Probability';
        } else {
            resultIcon.className = 'result-icon warning';
            resultIcon.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
            resultPrediction.textContent = 'May Need Improvement';
            resultPrediction.style.color = '#ef4444';
            probabilityLabel.textContent = 'Placement Probability';
        }

        // Generate recommendations
        const recommendations = this.generateRecommendations(formData, prediction);
        recommendationList.innerHTML = '';
        recommendations.forEach(rec => {
            const li = document.createElement('li');
            li.textContent = rec;
            recommendationList.appendChild(li);
        });

        // Show result with animation
        resultSection.style.display = 'block';
        resultSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    generateRecommendations(formData, prediction) {
        const recommendations = [];

        if (prediction.prediction === 1) {
            recommendations.push('Excellent! You have a high chance of placement.');
            recommendations.push('Continue maintaining your academic performance.');
            recommendations.push('Focus on developing technical and soft skills.');
            recommendations.push('Practice coding problems and technical interviews.');
            recommendations.push('Build projects to showcase your abilities.');
        } else {
            if (formData.cgpa < 7.0) {
                recommendations.push('Focus on improving your CGPA to above 7.0.');
                recommendations.push('Seek help from professors and peers for academic support.');
            }
            
            if (formData.backlogs === 1) {
                recommendations.push('Clear all pending backlogs as soon as possible.');
                recommendations.push('Create a study plan to avoid future backlogs.');
            }
            
            recommendations.push('Enhance your skills through online courses and certifications.');
            recommendations.push('Participate in coding competitions and hackathons.');
            recommendations.push('Build a strong portfolio with practical projects.');
            recommendations.push('Practice interview skills and communication.');
            recommendations.push('Consider internships to gain practical experience.');
        }

        return recommendations;
    }

    setLoadingState(loading) {
        this.isLoading = loading;
        const btnText = document.querySelector('.btn-text');
        const btnLoader = document.querySelector('.btn-loader');
        const predictBtn = document.getElementById('predictBtn');

        if (loading) {
            btnText.style.display = 'none';
            btnLoader.style.display = 'flex';
            predictBtn.disabled = true;
        } else {
            btnText.style.display = 'flex';
            btnLoader.style.display = 'none';
            predictBtn.disabled = false;
        }
    }

    showError(message) {
        // Simple error handling - could be enhanced with a toast library
        alert(message);
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new PlacementPredictor();
});

// Additional utility functions
const Utils = {
    formatNumber: (num) => {
        return new Intl.NumberFormat().format(num);
    },
    
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    validateCGPA: (cgpa) => {
        return !isNaN(cgpa) && cgpa >= 5.0 && cgpa <= 10.0;
    }
};

// Export for module usage if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PlacementPredictor, Utils };
}