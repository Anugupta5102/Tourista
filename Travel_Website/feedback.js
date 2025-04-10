const ratings = [];
document.addEventListener('DOMContentLoaded', () => {
  const starsContainers = document.getElementsByClassName("stars-container");
  const ratingTexts = document.querySelectorAll('[id$="-rating-text"]');
  //let currentRating = 0;

  function colourStar(ind, container) {
    try {
      if (!container) {
        console.error('Container element not found');
        return;
      }

      const stars = Array.from(container.querySelectorAll("span"));
      if (!stars.length) {
        console.error('No star elements found in container');
        return;
      }

      // remove existing rating
      stars.forEach(star => {
        if (star && star.style) {
          star.style.color = "white";
        }
      });

      // set new rating
      for(let i = 0; i < ind && i < stars.length; i++) {
        if (stars[i] && stars[i].style) {
          stars[i].style.color = "#FFA500";
        }
      }
    } catch (error) {
      console.error('Error in colourStar:', error);
    }
  }

  // Initialize star ratings for each container
  Array.from(starsContainers).forEach((container, index) => {
    try {
      if (!container) {
        console.error(`Stars container ${index} not found`);
        return;
      }

      container.innerHTML = ''; // Clear existing content
      ratings[index] = 0;

      for (let i = 1; i <= 5; i++) {
        const star = document.createElement('span');
        star.classList.add('star');
        star.innerHTML = '★';
        star.setAttribute('data-rating', i);
        
      try {
        if (star && star.style) {
          star.style.cursor = 'pointer';
          star.style.fontSize = '1.5rem';
          star.style.margin = '0 3px';
        } else {
          console.error('Star element or style property is null');
        }
      } catch (error) {
        console.error('Error setting star styles:', error);
      }

        star.addEventListener('click', () => {
          ratings[index] = i;
          updateRating(index);
          colourStar(i, container);
        });

        container.appendChild(star);
      }
    } catch (error) {
      console.error(`Error initializing stars for container ${index}:`, error);
    }
  });

  const updateRating = (index) => {
    try {
      if (ratingTexts[index]) {
        ratingTexts[index].textContent = `Rating: ${ratings[index]}`;
      } else {
        console.error(`Rating text element at index ${index} not found`);
      }
    } catch (error) {
      console.error('Error updating rating:', error);
    }
  };

function resetStars() {
    Array.from(starsContainers).forEach((starsContainer, index) => {
      ratings[index] = 0; 
      colourStar(0, starsContainer); 
      const ratingText = document.getElementById(starsContainer.id.replace("-stars-container", "-rating-text"));
      if (ratingText) {
        ratingText.textContent = "Rating: 0";
      }
    });
  }

window.submitFeedback = async function submitFeedback() {
  const feedbackInput = document.getElementById("feedback-input");
  if (!feedbackInput) {
    console.error('Feedback input element not found');
    return;
  }
  
  const feedback = feedbackInput.value.trim();
  
  // Check if ratings are valid
  if (!ratings || ratings.length === 0 || ratings.some(rating => rating === 0)) {
    Swal.fire({
      icon: 'error',
      title: 'Oops...',
      text: 'Please provide ratings for all categories before submitting.',
    });
    return;
  }
  
  // Check if the feedback is empty
  if (feedback === "") {
    Swal.fire({
      icon: 'error',
      title: 'Oops...',
      text: 'Please enter your feedback before submitting.',
    });
    return;
  }

  try {
    const response = await fetch('/api/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ratings: ratings,
        comments: feedback
      })
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    Swal.fire({
      icon: 'success',
      title: 'Success!',
      text: 'Your feedback has been submitted successfully.',
    }).then((result) => {
      if (result.isConfirmed || result.isDismissed) {
        feedbackInput.value = "";
        resetStars();
      }
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'There was a problem submitting your feedback. Please try again later.',
    });
  }
};
});
