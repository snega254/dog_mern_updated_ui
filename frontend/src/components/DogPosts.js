import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './DogPosts.css';

const DogPosts = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [userPosts, setUserPosts] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('community');
  const [newPost, setNewPost] = useState({
    title: '',
    description: '',
    dogBreed: '',
    dogAge: '',
    tags: ''
  });
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchPosts();
    fetchUserPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/posts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPosts(response.data.posts);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setLoading(false);
    }
  };

  const fetchUserPosts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/posts/my-posts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserPosts(response.data.posts);
    } catch (error) {
      console.error('Error fetching user posts:', error);
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 5); // Max 5 images
    setImages(files);
  };

  const handleCreatePost = async () => {
    if (!newPost.title.trim() || images.length === 0) {
      alert('Please add a title and at least one image');
      return;
    }

    setUploading(true);

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();

      // Append post data
      Object.keys(newPost).forEach(key => {
        formData.append(key, newPost[key]);
      });

      // Append images
      images.forEach(image => {
        formData.append('images', image);
      });

      await axios.post('http://localhost:5000/api/posts', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      alert('Post created successfully!');
      setShowCreateModal(false);
      resetForm();
      fetchPosts();
      fetchUserPosts();
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:5000/api/posts/${postId}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update local state
      const updatedPosts = posts.map(post => {
        if (post._id === postId) {
          const hasLiked = post.likes.includes(getUserId());
          return {
            ...post,
            likes: hasLiked 
              ? post.likes.filter(id => id !== getUserId())
              : [...post.likes, getUserId()],
            likesCount: hasLiked ? post.likesCount - 1 : post.likesCount + 1
          };
        }
        return post;
      });
      setPosts(updatedPosts);

      // Update user posts as well
      const updatedUserPosts = userPosts.map(post => {
        if (post._id === postId) {
          const hasLiked = post.likes.includes(getUserId());
          return {
            ...post,
            likes: hasLiked 
              ? post.likes.filter(id => id !== getUserId())
              : [...post.likes, getUserId()],
            likesCount: hasLiked ? post.likesCount - 1 : post.likesCount + 1
          };
        }
        return post;
      });
      setUserPosts(updatedUserPosts);

    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleComment = async (postId, commentText) => {
    if (!commentText.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:5000/api/posts/${postId}/comment`,
        { text: commentText },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update local state
      const updatedPosts = posts.map(post => {
        if (post._id === postId) {
          return {
            ...post,
            comments: [...post.comments, response.data.comment]
          };
        }
        return post;
      });
      setPosts(updatedPosts);

      // Update user posts as well
      const updatedUserPosts = userPosts.map(post => {
        if (post._id === postId) {
          return {
            ...post,
            comments: [...post.comments, response.data.comment]
          };
        }
        return post;
      });
      setUserPosts(updatedUserPosts);

    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const deletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/posts/${postId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Post deleted successfully!');
      fetchPosts();
      fetchUserPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post. Please try again.');
    }
  };

  const getUserId = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.id;
  };

  const resetForm = () => {
    setNewPost({
      title: '',
      description: '',
      dogBreed: '',
      dogAge: '',
      tags: ''
    });
    setImages([]);
  };

  const displayPosts = activeTab === 'community' ? posts : userPosts;

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading community posts...</p>
      </div>
    );
  }

  return (
    <div className="dog-posts-container">
      <header className="posts-header">
        <div className="header-content">
          <h1>📸 Dog Community</h1>
          <p>Share your dog's photos and connect with other pet lovers</p>
        </div>
        <div className="header-actions">
          <button onClick={() => navigate('/dashboard_user')} className="back-btn">
            Back to Dashboard
          </button>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="create-post-btn"
          >
            + Create Post
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="posts-tabs">
        <button
          className={`tab ${activeTab === 'community' ? 'active' : ''}`}
          onClick={() => setActiveTab('community')}
        >
          🌟 Community Feed
        </button>
        <button
          className={`tab ${activeTab === 'my-posts' ? 'active' : ''}`}
          onClick={() => setActiveTab('my-posts')}
        >
          📝 My Posts
        </button>
      </div>

      {/* Posts Grid */}
      <div className="posts-grid">
        {displayPosts.length === 0 ? (
          <div className="no-posts">
            <div className="no-posts-icon">
              {activeTab === 'community' ? '📷' : '📝'}
            </div>
            <h3>
              {activeTab === 'community' 
                ? 'No posts yet' 
                : 'You haven\'t created any posts'
              }
            </h3>
            <p>
              {activeTab === 'community'
                ? 'Be the first to share your dog\'s photos!'
                : 'Create your first post to share with the community'
              }
            </p>
            {activeTab === 'my-posts' && (
              <button 
                onClick={() => setShowCreateModal(true)}
                className="create-first-post-btn"
              >
                Create Your First Post
              </button>
            )}
          </div>
        ) : (
          displayPosts.map(post => (
            <div key={post._id} className="post-card">
              {/* Post Header */}
              <div className="post-header">
                <div className="post-user">
                  <div className="user-avatar">
                    {post.userId?.name?.charAt(0) || 'U'}
                  </div>
                  <div className="user-info">
                    <div className="user-name">{post.userId?.name || 'Anonymous'}</div>
                    <div className="post-date">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                {activeTab === 'my-posts' && (
                  <button
                    onClick={() => deletePost(post._id)}
                    className="delete-post-btn"
                    title="Delete post"
                  >
                    🗑️
                  </button>
                )}
              </div>

              {/* Post Images */}
              {post.images && post.images.length > 0 && (
                <div className="post-images">
                  {post.images.map((image, index) => (
                    <img
                      key={index}
                      src={`http://localhost:5000${image}`}
                      alt={`Post image ${index + 1}`}
                      className="post-image"
                    />
                  ))}
                </div>
              )}

              {/* Post Content */}
              <div className="post-content">
                <h3 className="post-title">{post.title}</h3>
                {post.description && (
                  <p className="post-description">{post.description}</p>
                )}
                
                {/* Dog Info */}
                {(post.dogBreed || post.dogAge) && (
                  <div className="dog-info">
                    {post.dogBreed && (
                      <span className="dog-breed">{post.dogBreed}</span>
                    )}
                    {post.dogAge && (
                      <span className="dog-age">{post.dogAge}</span>
                    )}
                  </div>
                )}

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                  <div className="post-tags">
                    {post.tags.map((tag, index) => (
                      <span key={index} className="tag">#{tag}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Post Stats */}
              <div className="post-stats">
                <div className="stat">
                  <span className="stat-icon">❤️</span>
                  <span className="stat-count">{post.likesCount || 0}</span>
                </div>
                <div className="stat">
                  <span className="stat-icon">💬</span>
                  <span className="stat-count">{post.comments?.length || 0}</span>
                </div>
              </div>

              {/* Post Actions */}
              <div className="post-actions">
                <button
                  onClick={() => handleLike(post._id)}
                  className={`like-btn ${post.likes?.includes(getUserId()) ? 'liked' : ''}`}
                >
                  {post.likes?.includes(getUserId()) ? '❤️ Liked' : '🤍 Like'}
                </button>
                <button className="comment-btn">
                  💬 Comment
                </button>
                <button className="share-btn">
                  🔗 Share
                </button>
              </div>

              {/* Comments Section - UPDATED STRUCTURE */}
              <div className="comments-section">
                <div className="comments-scroll-container">
                  {post.comments && post.comments.slice(0, 10).map(comment => (
                    <div key={comment._id} className="comment">
                      <div className="comment-user">
                        <strong>{comment.userId?.name || 'Anonymous'}:</strong>
                      </div>
                      <div className="comment-text">{comment.text}</div>
                      <div className="comment-time">
                        {new Date(comment.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Add Comment */}
                <div className="add-comment">
                  <input
                    type="text"
                    placeholder="Add a comment..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && e.target.value.trim()) {
                        handleComment(post._id, e.target.value);
                        e.target.value = '';
                      }
                    }}
                    className="comment-input"
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Post Modal - FIXED CLASS NAME */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="create-post-modal"> {/* ← REMOVED modal-content class */}
            <div className="modal-header">
              <h2>Create New Post</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="close-modal"
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Post Title *</label>
                <input
                  type="text"
                  value={newPost.title}
                  onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                  placeholder="Give your post a title..."
                  maxLength={100}
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newPost.description}
                  onChange={(e) => setNewPost({...newPost, description: e.target.value})}
                  placeholder="Tell us about your dog..."
                  rows="3"
                  maxLength={500}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Dog Breed</label>
                  <input
                    type="text"
                    value={newPost.dogBreed}
                    onChange={(e) => setNewPost({...newPost, dogBreed: e.target.value})}
                    placeholder="e.g., Labrador, Beagle"
                  />
                </div>
                <div className="form-group">
                  <label>Dog Age</label>
                  <input
                    type="text"
                    value={newPost.dogAge}
                    onChange={(e) => setNewPost({...newPost, dogAge: e.target.value})}
                    placeholder="e.g., 2 years, Puppy"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Tags (comma separated)</label>
                <input
                  type="text"
                  value={newPost.tags}
                  onChange={(e) => setNewPost({...newPost, tags: e.target.value})}
                  placeholder="e.g., cute, playful, adoption"
                />
              </div>

              <div className="form-group">
                <label>Upload Photos (Max 5) *</label>
                <div className="image-upload">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                    id="post-images"
                  />
                  <label htmlFor="post-images" className="upload-label">
                    📷 Choose Photos
                  </label>
                  {images.length > 0 && (
                    <div className="image-previews">
                      {images.map((image, index) => (
                        <div key={index} className="image-preview">
                          <img src={URL.createObjectURL(image)} alt={`Preview ${index}`} />
                          <span>{image.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                onClick={() => setShowCreateModal(false)}
                className="btn-cancel"
                disabled={uploading}
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePost}
                disabled={uploading || !newPost.title || images.length === 0}
                className="btn-create"
              >
                {uploading ? 'Creating Post...' : 'Create Post'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DogPosts;