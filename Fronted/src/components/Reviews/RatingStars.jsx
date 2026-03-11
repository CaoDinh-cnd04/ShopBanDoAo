const RatingStars = ({ rating, size = '1rem', interactive = false, onRatingChange }) => {
    return (
        <div className="d-flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <i
                    key={star}
                    className={`bi bi-star${star <= rating ? '-fill' : ''} text-warning`}
                    style={{
                        fontSize: size,
                        cursor: interactive ? 'pointer' : 'default'
                    }}
                    onClick={() => interactive && onRatingChange && onRatingChange(star)}
                ></i>
            ))}
        </div>
    );
};

export default RatingStars;
