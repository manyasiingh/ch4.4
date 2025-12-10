import React, { useContext, useEffect, useState } from 'react';
import { CartContext } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import './BookCard.css';

export default function BookCard({ book }) {
  const { addToCart } = useContext(CartContext);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const email = localStorage.getItem('email');

  const [isWishlisted, setIsWishlisted] = useState(false);

  // Function to fix image URLs
  const getImageUrl = (url) => {
    if (!url || url.trim() === '') {
      return '/images/default-book.jpg';
    }
    
    // If it's already a full URL (http/https), return as-is
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    // If it already starts with /images/, return as-is
    if (url.startsWith('/images/')) {
      return url;
    }
    
    // If it starts with / but not /images/, check if it's a localhost path
    if (url.startsWith('/') && !url.startsWith('/images/')) {
      // This might be from localhost conversion, return as-is
      return url;
    }
    
    // If it's just a filename (UUID.png), add /images/ prefix
    // Check if it looks like a UUID filename (with extension)
    const uuidRegex = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\.(jpg|jpeg|png|gif|webp)$/i;
    const simpleFilenameRegex = /\.(jpg|jpeg|png|gif|webp)$/i;
    
    if (uuidRegex.test(url) || simpleFilenameRegex.test(url)) {
      return `/images/${url}`;
    }
    
    // Default fallback
    return '/images/default-book.jpg';
  };

  useEffect(() => {
    const fetchWishlistStatus = async () => {
      if (!email) return;
      const res = await fetch(`/api/wishlist/${email}`);
      if (res.ok) {
        const data = await res.json();
        setIsWishlisted(data.some(item => item.bookId === book.id));
      }
    };
    fetchWishlistStatus();
  }, [book.id, email]);

  const toggleWishlist = async () => {
    if (!email) {
      alert('Please log in to use the wishlist.');
      return;
    }

    if (isWishlisted) {
      await fetch(`/api/wishlist/${email}/${book.id}`, {
        method: 'DELETE'
      });
      setIsWishlisted(false);
    } else {
      const res = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, bookId: book.id })
      });

      if (res.ok) {
        setIsWishlisted(true);
      } else {
        alert('Already in wishlist.');
      }
    }
  };

  const handleAddToCart = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    addToCart(book);
  };

  return (
    <div className="book-card">
      <div onClick={() => navigate(`/book/${book.id}`)} className='cur'>
        <img
          src={getImageUrl(book.coverImageUrl)}
          alt={book.title}
          className="book-image"
          onError={(e) => {
            console.error('Failed to load image:', book.coverImageUrl);
            e.target.onerror = null; // Prevent infinite loop
            e.target.src = '/images/default-book.jpg';
          }}
          onLoad={(e) => {
            console.log('Successfully loaded image:', book.coverImageUrl);
          }}
        />
        <h3>{book.title}</h3>
        <h4>{book.author}</h4>
        <p>₹{book.price}</p>
        <p>In Stock: {book.quantity}</p>
      </div>
      <button
        onClick={() => {
          toggleWishlist();
        }}
        className={`wishlist-icon ${isWishlisted ? 'selected' : ''}`}
        title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        ♥
      </button>
      <button
        disabled={book.quantity === 0}
        onClick={() => handleAddToCart(book.id)}>
        {book.quantity === 0 ? 'Sold Out' : 'Add to Cart'}
      </button>
    </div>
  );
}