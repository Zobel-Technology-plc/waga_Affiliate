'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import WebApp from '@twa-dev/sdk'; // Ensure WebApp SDK is properly imported
import { FaInstagram, FaTelegramPlane, FaFacebook } from 'react-icons/fa';
import styles from './index.module.css';

/// Modal Component
const Modal = ({
  option,
  isOpen,
  onClose,
  handleCheckClick,
  completedActions,
  inviteLink,
  joinClicked,
}) => {
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen) return null;

  const instagramShareUrl = `https://www.instagram.com/?url=${encodeURIComponent(inviteLink)}`;
  const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=Join%20now!`;
  const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(inviteLink)}`;

  const handleCopyClick = () => {
    navigator.clipboard.writeText(inviteLink);
    setIsCopied(true);
  };

  const modalClass = `${styles.modalContent} ${
    option.text === 'Invite Your Friend' ? styles.longerModal : ''
  }`;

  return (
    <div className={styles.modalOverlay}>
      <div className={modalClass}>
        <button className={styles.closeButton} onClick={onClose}>
          ×
        </button>
        <h2>{option.text}</h2>
        <p>Earn points by completing this action.</p>
        <h1>{new Intl.NumberFormat().format(option.points)}</h1>
        <Image
          className={styles.image}
          src={option.icon}
          alt={option.text}
          width={60}
          height={60}
        />

        {option.text === 'Invite Your Friend' ? (
          <div>
            <p>{inviteLink}</p>
            <button className={styles.copyButton} onClick={handleCopyClick}>
              {isCopied ? 'Copied!' : 'Copy Link'}
            </button>
            <div className={styles.socialIcons}>
              <a href={instagramShareUrl} target="_blank" rel="noopener noreferrer">
                <FaInstagram size={30} className={styles.icon} />
              </a>
              <a href={telegramShareUrl} target="_blank" rel="noopener noreferrer">
                <FaTelegramPlane size={30} className={styles.icon} />
              </a>
              <a href={facebookShareUrl} target="_blank" rel="noopener noreferrer">
                <FaFacebook size={30} className={styles.icon} />
              </a>
            </div>
          </div>
        ) : (
          <button
            id={option.text}
            className={`${styles.joinButton} ${
              completedActions[option.text] ? styles.doneButton : joinClicked ? styles.checkButton : ''
            }`}
            onClick={(e) => handleCheckClick(e, option, joinClicked)}
          >
            {completedActions[option.text] ? 'Done' : joinClicked ? 'Check' : 'Join'}
          </button>
        )}
      </div>
    </div>
  );
};

// EarnPage Component
const EarnPage = () => {
  const [userId, setUserId] = useState(null);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completedActions, setCompletedActions] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [inviteLink, setInviteLink] = useState('');
  const [joinClicked, setJoinClicked] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        if (WebApp.initDataUnsafe?.user?.id) {
          const user = WebApp.initDataUnsafe.user;
          setUserId(user.id);

          const generateInviteLink = async () => {
            try {
              const response = await fetch(`/api/invite`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId: user.id }),
              });

              const data = await response.json();
              if (data.success) {
                setInviteLink(data.inviteLink);
              } else {
                console.error('Failed to generate invite link:', data.message);
              }
            } catch (error) {
              console.error('Error generating invite link:', error);
            }
          };

          generateInviteLink();
        } else {
          console.error("User ID not found in WebApp.initDataUnsafe");
        }
      } catch (error) {
        console.error('Error accessing WebApp data:', error);
      }
    }
  }, []);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const response = await fetch('/api/earnOptions');
        const data = await response.json();
        if (response.ok) {
          const inviteOption = data.data.find(option => option.text === 'Invite Your Friend');
          const otherOptions = data.data.filter(option => option.text !== 'Invite Your Friend');
          setOptions([inviteOption, ...otherOptions]);
        } else {
          console.error('Failed to fetch options:', data.message);
        }
      } catch (error) {
        console.error('Error fetching options:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOptions();
  }, []);

  useEffect(() => {
    if (userId) {
      const fetchCompletedActions = async () => {
        try {
          const response = await fetch(`/api/user/actions?userId=${userId}`);
          const data = await response.json();

          if (response.ok) {
            const actionStatus = {};
            data.actions.forEach((action) => {
              actionStatus[action.action] = true;
            });
            setCompletedActions(actionStatus);
          } else {
            console.error('Failed to fetch completed actions:', data.message);
          }
        } catch (error) {
          console.error('Error fetching completed actions:', error);
        }
      };

      fetchCompletedActions();
    }
  }, [userId]);

  const handleCheckClick = async (event, option, joinClicked) => {
    event.preventDefault();

    if (completedActions[option.text]) {
      if (option.link) {
        window.open(option.link, '_blank');
      }
      return;
    }

    if (option.link) {
      window.open(option.link, '_blank');
    }

    if (!joinClicked) {
      setJoinClicked(true);
      return;
    }

    try {
      const response = await fetch('/api/user/actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, actionType: 'earn', action: option.text, points: option.points }),
      });

      if (response.ok) {
        setCompletedActions((prev) => ({ ...prev, [option.text]: true }));

        if (option.link) {
          window.open(option.link, '_blank');
        }
      } else {
        console.error('Failed to save action');
      }
    } catch (error) {
      console.error('Error saving action:', error);
    }
  };

  const handleCardClick = (option) => {
    setSelectedOption(option);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedOption(null);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={`${styles.earnOptions} ${isModalOpen ? styles.blurredBackground : ''}`}>
        {options.map((option, index) => (
          <div key={index} className={styles.option} onClick={() => handleCardClick(option)}>
            <Image className={styles.image} src={option.icon} alt={option.text} width={60} height={60} />
            <div className={styles.text}>
              <p>{option.text}</p>
              <span>{`+${new Intl.NumberFormat().format(option.points)}`}</span>
            </div>
          </div>
        ))}
      </div>

      {selectedOption && (
        <Modal
          option={selectedOption}
          isOpen={isModalOpen}
          onClose={closeModal}
          handleCheckClick={handleCheckClick}
          completedActions={completedActions}
          inviteLink={inviteLink}
          joinClicked={joinClicked}
        />
      )}
    </div>
  );
};

export default EarnPage;

