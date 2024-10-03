// Modal Component
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { FaInstagram, FaTelegramPlane, FaFacebook } from 'react-icons/fa';
import styles from './index.module.css';

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
            disabled={completedActions[option.text]} // Disable if action is completed
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
    if (typeof window !== 'undefined' && WebApp.initDataUnsafe.user) {
      setUserId(WebApp.initDataUnsafe.user.id);

      const generateInviteLink = async () => {
        try {
          const response = await fetch(`/api/invite`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId }),
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
    }
  }, [userId]);

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
      const checkTelegramMembership = async () => {
        try {
          const response = await fetch(`/api/checkMembership?userId=${userId}`);
          const data = await response.json();

          if (data.isMember) {
            setCompletedActions((prev) => ({
              ...prev,
              'Join our TG channel': true, // Set "Done" state for Telegram
            }));
          }
        } catch (error) {
          console.error('Error checking Telegram membership:', error);
        }
      };

      checkTelegramMembership();
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      const fetchCompletedActions = async () => {
        try {
          const response = await fetch(`/api/user/actions?userId=${userId}`);
          const data = await response.json();

          if (response.ok) {
            const actionStatus = {};
            options.forEach((option) => {
              actionStatus[option.text] = data.completedActions.includes(option.text);
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
  }, [userId, options]);

  const handleCheckClick = async (event, option, joinClicked) => {
    event.preventDefault();

    if (completedActions[option.text]) {
      return; // Do nothing if action is already completed
    }

    // Open the link in a new tab
    if (option.link) {
      window.open(option.link, '_blank');
    }

    if (!joinClicked) {
      setJoinClicked(true);
      return; // User needs to come back and click "Check"
    }

    if (option.text === 'Join our TG channel') {
      // Verify Telegram membership before marking action as complete
      try {
        const response = await fetch(`/api/checkMembership?userId=${userId}`);
        const data = await response.json();

        if (data.isMember) {
          // Save the action with 0 points for the Telegram join
          const saveActionResponse = await fetch('/api/user/actions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId, actionType: 'earn', action: option.text, points: 0 }),
          });

          if (saveActionResponse.ok) {
            setCompletedActions((prev) => ({ ...prev, [option.text]: true }));
          } else {
            console.error('Failed to save action');
          }
        } else {
          console.error('User is not a member of the Telegram channel.');
        }
      } catch (error) {
        console.error('Error verifying membership or saving action:', error);
      }
    } else {
      // Handle other action types (not Telegram)
      try {
        const saveActionResponse = await fetch('/api/user/actions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId, actionType: 'earn', action: option.text, points: option.points }),
        });

        if (saveActionResponse.ok) {
          setCompletedActions((prev) => ({ ...prev, [option.text]: true }));
        } else {
          console.error('Failed to save action');
        }
      } catch (error) {
        console.error('Error saving action:', error);
      }
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

      {/* Modal */}
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
