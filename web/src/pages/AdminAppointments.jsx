import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { createPortal } from 'react-dom';
import { FaTrash, FaSearch, FaPen, FaPaperPlane, FaUser, FaEnvelope, FaCalendar, FaPhone, FaVideo, FaUserShield, FaArchive, FaUndo, FaCommentDots, FaCheck, FaCheckDouble, FaBan, FaTimes, FaLightbulb, FaCopy, FaEllipsisV, FaInfoCircle, FaSync, FaStar, FaRegStar, FaFlag, FaCalendarAlt, FaCheckSquare, FaDownload, FaSpinner, FaDollarSign, FaHistory } from "react-icons/fa";
import { FormattedTextWithLinks, FormattedTextWithLinksAndSearch, FormattedTextWithReadMore } from '../utils/linkFormatter.jsx';
import UserAvatar from '../components/UserAvatar';
import { focusWithoutKeyboard, focusWithKeyboard } from '../utils/mobileUtils';
import ImagePreview from '../components/ImagePreview';
import LinkPreview from '../components/LinkPreview';
import { EmojiButton } from '../components/EmojiPicker';
import { useSelector, useDispatch } from "react-redux";
import { useState as useLocalState } from "react";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import { toast, ToastContainer } from 'react-toastify';
import { socket } from "../utils/socket";
import { useSoundEffects } from "../components/SoundEffects";
import { exportEnhancedChatToPDF } from '../utils/pdfExport';
import ExportChatModal from '../components/ExportChatModal';
import CallHistoryModal from '../components/CallHistoryModal';
import axios from 'axios';
import { usePageTitle } from '../hooks/usePageTitle';
import { signoutUserStart, signoutUserSuccess, signoutUserFailure } from "../redux/user/userSlice";
// Note: Do not import server-only libs here

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function AdminAppointments() {
  // Set page title
  usePageTitle("Appointment Management - Admin Panel");

  const { currentUser } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Handle navigation state when coming from direct chat link
  const location = useLocation();
  const params = useParams();
  const [shouldOpenChatFromNotification, setShouldOpenChatFromNotification] = useState(false);
  const [activeChatAppointmentId, setActiveChatAppointmentId] = useState(null);
  const [missingChatbookError, setMissingChatbookError] = useState(null);
  const chatResolveRef = useRef(false);
  const chatIntervalRef = useRef(null);
  const chatTimeoutRef = useRef(null);

  // Function to handle phone number clicks
  const handlePhoneClick = (phoneNumber) => {
    // Check if it's a mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      // For mobile devices, open phone dialer
      window.location.href = `tel:${phoneNumber}`;
    } else {
      // For desktop, copy to clipboard
      navigator.clipboard.writeText(phoneNumber).then(() => {
        toast.success(`Phone number ${phoneNumber} copied to clipboard!`);
      }).catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = phoneNumber;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        toast.success(`Phone number ${phoneNumber} copied to clipboard!`);
      });
    }
  };
  const [appointments, setAppointments] = useState([]);
  const [allAppointments, setAllAppointments] = useState([]);
  const [archivedAppointments, setArchivedAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  // Removed role filter
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [archivedCurrentPage, setArchivedCurrentPage] = useState(1);
  const [archivedTotalPages, setArchivedTotalPages] = useState(1);
  const [filteredArchivedAppointments, setFilteredArchivedAppointments] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userLoading, setUserLoading] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  // State for appointment action modals
  const [appointmentToHandle, setAppointmentToHandle] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReinitiateModal, setShowReinitiateModal] = useState(false);
  const [reinitiatePaymentStatus, setReinitiatePaymentStatus] = useState(null);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
      const [showUnarchiveModal, setShowUnarchiveModal] = useState(false);
  
  // Reactions state
  const [showReactionsBar, setShowReactionsBar] = useState(false);
  const [reactionsMessageId, setReactionsMessageId] = useState(null);
  const [showReactionsEmojiPicker, setShowReactionsEmojiPicker] = useState(false);
  const [reactionEmojiSearchTerm, setReactionEmojiSearchTerm] = useState('');

  // Comprehensive emoji data with keywords for search
  const emojiData = [
    // Smileys & People
    { emoji: '😀', keywords: ['grinning', 'happy', 'smile', 'joy'] },
    { emoji: '😃', keywords: ['grinning', 'happy', 'smile', 'joy', 'smiley'] },
    { emoji: '😄', keywords: ['grinning', 'happy', 'smile', 'joy', 'laugh'] },
    { emoji: '😁', keywords: ['grinning', 'happy', 'smile', 'joy', 'beaming'] },
    { emoji: '😆', keywords: ['grinning', 'happy', 'smile', 'joy', 'laugh', 'squinting'] },
    { emoji: '😅', keywords: ['grinning', 'happy', 'smile', 'sweat', 'relief'] },
    { emoji: '😂', keywords: ['joy', 'laugh', 'tears', 'funny', 'lol', 'crying'] },
    { emoji: '🤣', keywords: ['rolling', 'laugh', 'funny', 'lol', 'rofl'] },
    { emoji: '😊', keywords: ['smiling', 'happy', 'blush', 'smile'] },
    { emoji: '😇', keywords: ['innocent', 'angel', 'halo', 'good'] },
    { emoji: '🙂', keywords: ['slightly', 'smiling', 'happy'] },
    { emoji: '🙃', keywords: ['upside', 'down', 'silly', 'sarcastic'] },
    { emoji: '😉', keywords: ['winking', 'flirt', 'wink'] },
    { emoji: '😌', keywords: ['relieved', 'peaceful', 'calm'] },
    { emoji: '😍', keywords: ['heart', 'eyes', 'love', 'adore', 'crush'] },
    { emoji: '🥰', keywords: ['smiling', 'hearts', 'love', 'adore'] },
    { emoji: '😘', keywords: ['kiss', 'love', 'heart'] },
    { emoji: '😗', keywords: ['kissing', 'kiss'] },
    { emoji: '😙', keywords: ['kissing', 'smiling', 'eyes'] },
    { emoji: '😚', keywords: ['kissing', 'closed', 'eyes'] },
    { emoji: '😋', keywords: ['yummy', 'delicious', 'tongue'] },
    { emoji: '😛', keywords: ['tongue', 'out', 'playful'] },
    { emoji: '😝', keywords: ['tongue', 'winking', 'playful'] },
    { emoji: '😜', keywords: ['tongue', 'winking', 'crazy'] },
    { emoji: '🤪', keywords: ['zany', 'crazy', 'wild'] },
    { emoji: '🤨', keywords: ['raised', 'eyebrow', 'suspicious'] },
    { emoji: '🧐', keywords: ['monocle', 'thinking', 'pondering'] },
    { emoji: '🤓', keywords: ['nerd', 'geek', 'glasses'] },
    { emoji: '😎', keywords: ['cool', 'sunglasses', 'awesome'] },
    { emoji: '🤩', keywords: ['star', 'struck', 'excited'] },
    { emoji: '🥳', keywords: ['party', 'celebration', 'hat'] },
    { emoji: '😏', keywords: ['smirk', 'sly', 'mischievous'] },
    { emoji: '😒', keywords: ['unamused', 'bored', 'meh'] },
    { emoji: '😞', keywords: ['disappointed', 'sad'] },
    { emoji: '😔', keywords: ['pensive', 'sad', 'thoughtful'] },
    { emoji: '😟', keywords: ['worried', 'concerned'] },
    { emoji: '😕', keywords: ['confused', 'slightly', 'frowning'] },
    { emoji: '🙁', keywords: ['slightly', 'frowning', 'sad'] },
    { emoji: '☹️', keywords: ['frowning', 'sad'] },
    { emoji: '😣', keywords: ['persevering', 'struggling'] },
    { emoji: '😖', keywords: ['confounded', 'frustrated'] },
    { emoji: '😫', keywords: ['tired', 'exhausted'] },
    { emoji: '😩', keywords: ['weary', 'tired'] },
    { emoji: '🥺', keywords: ['pleading', 'puppy', 'eyes'] },
    { emoji: '😢', keywords: ['crying', 'sad', 'tear'] },
    { emoji: '😭', keywords: ['loudly', 'crying', 'sad', 'bawling'] },
    { emoji: '😤', keywords: ['huffing', 'angry', 'steam'] },
    { emoji: '😠', keywords: ['angry', 'mad'] },
    { emoji: '😡', keywords: ['pouting', 'angry', 'rage'] },
    { emoji: '🤬', keywords: ['swearing', 'cursing', 'angry'] },
    { emoji: '🤯', keywords: ['exploding', 'head', 'mind', 'blown'] },
    { emoji: '😳', keywords: ['flushed', 'embarrassed'] },
    { emoji: '🥵', keywords: ['hot', 'sweating'] },
    { emoji: '🥶', keywords: ['cold', 'freezing'] },
    { emoji: '😱', keywords: ['screaming', 'fear', 'shocked'] },
    { emoji: '😨', keywords: ['fearful', 'scared'] },
    { emoji: '😰', keywords: ['anxious', 'sweat', 'worried'] },
    { emoji: '😥', keywords: ['sad', 'relieved', 'disappointed'] },
    { emoji: '😓', keywords: ['downcast', 'sweat', 'sad'] },
    { emoji: '🤗', keywords: ['hugging', 'hug', 'embrace'] },
    { emoji: '🤔', keywords: ['thinking', 'pondering'] },
    { emoji: '🤭', keywords: ['hand', 'over', 'mouth', 'giggle'] },
    { emoji: '🤫', keywords: ['shushing', 'quiet', 'secret'] },
    { emoji: '🤥', keywords: ['lying', 'pinocchio'] },
    { emoji: '😶', keywords: ['no', 'mouth', 'speechless'] },
    { emoji: '😐', keywords: ['neutral', 'expressionless'] },
    { emoji: '😑', keywords: ['expressionless', 'blank'] },
    { emoji: '😯', keywords: ['hushed', 'surprised'] },
    { emoji: '😦', keywords: ['frowning', 'open', 'mouth'] },
    { emoji: '😧', keywords: ['anguished', 'shocked'] },
    { emoji: '😮', keywords: ['open', 'mouth', 'surprised', 'wow'] },
    { emoji: '😲', keywords: ['astonished', 'shocked'] },
    { emoji: '🥱', keywords: ['yawning', 'tired', 'sleepy'] },
    { emoji: '😴', keywords: ['sleeping', 'zzz', 'tired'] },
    { emoji: '🤤', keywords: ['drooling', 'sleepy'] },
    { emoji: '😪', keywords: ['sleepy', 'tired'] },
    { emoji: '😵', keywords: ['dizzy', 'confused'] },
    { emoji: '🤐', keywords: ['zipper', 'mouth', 'quiet'] },
    { emoji: '🥴', keywords: ['woozy', 'drunk', 'dizzy'] },
    { emoji: '🤢', keywords: ['nauseated', 'sick'] },
    { emoji: '🤮', keywords: ['vomiting', 'sick'] },
    { emoji: '🤧', keywords: ['sneezing', 'sick'] },
    { emoji: '😷', keywords: ['mask', 'sick', 'medical'] },
    { emoji: '🤒', keywords: ['thermometer', 'sick', 'fever'] },
    { emoji: '🤕', keywords: ['bandage', 'hurt', 'injured'] },
    { emoji: '🤑', keywords: ['money', 'mouth', 'rich'] },
    { emoji: '🤠', keywords: ['cowboy', 'hat'] },
    { emoji: '💀', keywords: ['skull', 'death', 'dead'] },
    { emoji: '👻', keywords: ['ghost', 'spooky'] },
    { emoji: '👽', keywords: ['alien', 'extraterrestrial'] },
    { emoji: '👾', keywords: ['alien', 'monster', 'game'] },
    { emoji: '🤖', keywords: ['robot', 'bot'] },
    { emoji: '😈', keywords: ['smiling', 'devil', 'evil'] },
    { emoji: '👿', keywords: ['angry', 'devil', 'evil'] },
    { emoji: '👹', keywords: ['ogre', 'monster'] },
    { emoji: '👺', keywords: ['goblin', 'monster'] },

    // Gestures & Body Parts
    { emoji: '💪', keywords: ['flexed', 'biceps', 'strong', 'muscle'] },
    { emoji: '👍', keywords: ['thumbs', 'up', 'good', 'yes', 'like', 'approve'] },
    { emoji: '👎', keywords: ['thumbs', 'down', 'bad', 'no', 'dislike'] },
    { emoji: '👌', keywords: ['ok', 'okay', 'perfect'] },
    { emoji: '✌️', keywords: ['victory', 'peace', 'two'] },
    { emoji: '🤞', keywords: ['crossed', 'fingers', 'luck'] },
    { emoji: '🤟', keywords: ['love', 'you', 'gesture'] },
    { emoji: '🤘', keywords: ['rock', 'on', 'horns'] },
    { emoji: '🤙', keywords: ['call', 'me', 'hang', 'loose'] },
    { emoji: '👈', keywords: ['pointing', 'left'] },
    { emoji: '👉', keywords: ['pointing', 'right'] },
    { emoji: '👆', keywords: ['pointing', 'up'] },
    { emoji: '👇', keywords: ['pointing', 'down'] },
    { emoji: '☝️', keywords: ['index', 'pointing', 'up'] },
    { emoji: '👋', keywords: ['waving', 'hand', 'hello', 'goodbye'] },
    { emoji: '🤚', keywords: ['raised', 'back', 'hand'] },
    { emoji: '🖐️', keywords: ['hand', 'five', 'fingers'] },
    { emoji: '✋', keywords: ['raised', 'hand', 'stop'] },
    { emoji: '🖖', keywords: ['vulcan', 'salute', 'spock'] },
    { emoji: '🤌', keywords: ['pinched', 'fingers'] },
    { emoji: '🤏', keywords: ['pinching', 'hand'] },

    // Animals & Nature
    { emoji: '🐶', keywords: ['dog', 'puppy', 'pet'] },
    { emoji: '🐱', keywords: ['cat', 'kitten', 'pet'] },
    { emoji: '🐭', keywords: ['mouse', 'rodent'] },
    { emoji: '🐹', keywords: ['hamster', 'pet'] },
    { emoji: '🐰', keywords: ['rabbit', 'bunny'] },
    { emoji: '🦊', keywords: ['fox'] },
    { emoji: '🐻', keywords: ['bear'] },
    { emoji: '🐼', keywords: ['panda', 'bear'] },
    { emoji: '🐨', keywords: ['koala'] },
    { emoji: '🐯', keywords: ['tiger'] },
    { emoji: '🦁', keywords: ['lion'] },
    { emoji: '🐮', keywords: ['cow'] },
    { emoji: '🐷', keywords: ['pig'] },
    { emoji: '🐸', keywords: ['frog'] },
    { emoji: '🐵', keywords: ['monkey'] },
    { emoji: '🙈', keywords: ['see', 'no', 'evil', 'monkey'] },
    { emoji: '🙉', keywords: ['hear', 'no', 'evil', 'monkey'] },
    { emoji: '🙊', keywords: ['speak', 'no', 'evil', 'monkey'] },
    { emoji: '🐒', keywords: ['monkey'] },
    { emoji: '🐔', keywords: ['chicken'] },
    { emoji: '🐧', keywords: ['penguin'] },
    { emoji: '🐦', keywords: ['bird'] },
    { emoji: '🐤', keywords: ['baby', 'chick'] },
    { emoji: '🐣', keywords: ['hatching', 'chick'] },
    { emoji: '🦆', keywords: ['duck'] },
    { emoji: '🦅', keywords: ['eagle'] },
    { emoji: '🦉', keywords: ['owl'] },
    { emoji: '🦇', keywords: ['bat'] },
    { emoji: '🐺', keywords: ['wolf'] },
    { emoji: '🐗', keywords: ['boar'] },
    { emoji: '🐴', keywords: ['horse'] },
    { emoji: '🦄', keywords: ['unicorn', 'magical'] },
    { emoji: '🐝', keywords: ['bee', 'honeybee'] },
    { emoji: '🐛', keywords: ['bug', 'insect'] },
    { emoji: '🦋', keywords: ['butterfly'] },
    { emoji: '🐌', keywords: ['snail'] },
    { emoji: '🐞', keywords: ['ladybug', 'beetle'] },
    { emoji: '🐜', keywords: ['ant'] },
    { emoji: '🦟', keywords: ['mosquito'] },
    { emoji: '🦗', keywords: ['cricket'] },
    { emoji: '🕷️', keywords: ['spider'] },
    { emoji: '🕸️', keywords: ['spider', 'web'] },
    { emoji: '🦂', keywords: ['scorpion'] },
    { emoji: '🐢', keywords: ['turtle'] },
    { emoji: '🐍', keywords: ['snake'] },
    { emoji: '🦎', keywords: ['lizard'] },
    { emoji: '🦖', keywords: ['t-rex', 'dinosaur'] },
    { emoji: '🦕', keywords: ['sauropod', 'dinosaur'] },
    { emoji: '🐙', keywords: ['octopus'] },
    { emoji: '🦑', keywords: ['squid'] },
    { emoji: '🦐', keywords: ['shrimp'] },
    { emoji: '🦞', keywords: ['lobster'] },
    { emoji: '🦀', keywords: ['crab'] },
    { emoji: '🐡', keywords: ['blowfish'] },
    { emoji: '🐠', keywords: ['tropical', 'fish'] },
    { emoji: '🐟', keywords: ['fish'] },
    { emoji: '🐬', keywords: ['dolphin'] },
    { emoji: '🐳', keywords: ['spouting', 'whale'] },
    { emoji: '🐋', keywords: ['whale'] },
    { emoji: '🦈', keywords: ['shark'] },
    { emoji: '🐊', keywords: ['crocodile'] },

    // Food & Drink
    { emoji: '🍎', keywords: ['apple', 'fruit', 'red'] },
    { emoji: '🍐', keywords: ['pear', 'fruit'] },
    { emoji: '🍊', keywords: ['orange', 'fruit'] },
    { emoji: '🍋', keywords: ['lemon', 'fruit', 'sour'] },
    { emoji: '🍌', keywords: ['banana', 'fruit'] },
    { emoji: '🍉', keywords: ['watermelon', 'fruit'] },
    { emoji: '🍇', keywords: ['grapes', 'fruit'] },
    { emoji: '🍓', keywords: ['strawberry', 'fruit'] },
    { emoji: '🫐', keywords: ['blueberries', 'fruit'] },
    { emoji: '🍈', keywords: ['melon', 'fruit'] },
    { emoji: '🍒', keywords: ['cherries', 'fruit'] },
    { emoji: '🍑', keywords: ['peach', 'fruit'] },
    { emoji: '🥭', keywords: ['mango', 'fruit'] },
    { emoji: '🍍', keywords: ['pineapple', 'fruit'] },
    { emoji: '🥥', keywords: ['coconut', 'fruit'] },
    { emoji: '🥝', keywords: ['kiwi', 'fruit'] },
    { emoji: '🍅', keywords: ['tomato', 'vegetable'] },
    { emoji: '🍆', keywords: ['eggplant', 'vegetable'] },
    { emoji: '🥑', keywords: ['avocado', 'fruit'] },
    { emoji: '🥦', keywords: ['broccoli', 'vegetable'] },
    { emoji: '🥬', keywords: ['leafy', 'greens', 'vegetable'] },
    { emoji: '🥒', keywords: ['cucumber', 'vegetable'] },
    { emoji: '🌶️', keywords: ['hot', 'pepper', 'spicy'] },
    { emoji: '🫑', keywords: ['bell', 'pepper', 'vegetable'] },
    { emoji: '🌽', keywords: ['corn', 'vegetable'] },
    { emoji: '🥕', keywords: ['carrot', 'vegetable'] },
    { emoji: '🫒', keywords: ['olive'] },
    { emoji: '🧄', keywords: ['garlic'] },
    { emoji: '🧅', keywords: ['onion'] },
    { emoji: '🥔', keywords: ['potato', 'vegetable'] },
    { emoji: '🍠', keywords: ['roasted', 'sweet', 'potato'] },
    { emoji: '🥐', keywords: ['croissant', 'bread'] },
    { emoji: '🥯', keywords: ['bagel', 'bread'] },
    { emoji: '🍞', keywords: ['bread', 'loaf'] },
    { emoji: '🥖', keywords: ['baguette', 'bread'] },
    { emoji: '🥨', keywords: ['pretzel'] },
    { emoji: '🧀', keywords: ['cheese'] },
    { emoji: '🥚', keywords: ['egg'] },
    { emoji: '🍳', keywords: ['cooking', 'egg', 'fried'] },
    { emoji: '🧈', keywords: ['butter'] },
    { emoji: '🥞', keywords: ['pancakes'] },
    { emoji: '🧇', keywords: ['waffle'] },
    { emoji: '🥓', keywords: ['bacon'] },
    { emoji: '🥩', keywords: ['cut', 'meat'] },
    { emoji: '🍗', keywords: ['poultry', 'leg', 'chicken'] },
    { emoji: '🍖', keywords: ['meat', 'bone'] },
    { emoji: '🦴', keywords: ['bone'] },
    { emoji: '🌭', keywords: ['hot', 'dog'] },
    { emoji: '🍔', keywords: ['hamburger', 'burger'] },
    { emoji: '🍟', keywords: ['french', 'fries'] },
    { emoji: '🍕', keywords: ['pizza'] },
    { emoji: '🥪', keywords: ['sandwich'] },
    { emoji: '🥙', keywords: ['stuffed', 'flatbread'] },
    { emoji: '🧆', keywords: ['falafel'] },
    { emoji: '🌮', keywords: ['taco'] },
    { emoji: '🌯', keywords: ['burrito'] },
    { emoji: '🫔', keywords: ['tamale'] },
    { emoji: '🥗', keywords: ['green', 'salad'] },
    { emoji: '🥘', keywords: ['shallow', 'pan', 'food'] },
    { emoji: '🫕', keywords: ['fondue'] },
    { emoji: '🥫', keywords: ['canned', 'food'] },
    { emoji: '🍝', keywords: ['spaghetti', 'pasta'] },
    { emoji: '🍜', keywords: ['steaming', 'bowl', 'ramen'] },
    { emoji: '🍲', keywords: ['pot', 'food', 'stew'] },
    { emoji: '🍛', keywords: ['curry', 'rice'] },
    { emoji: '🍣', keywords: ['sushi'] },
    { emoji: '🍱', keywords: ['bento', 'box'] },
    { emoji: '🥟', keywords: ['dumpling'] },
    { emoji: '🦪', keywords: ['oyster'] },
    { emoji: '🍤', keywords: ['fried', 'shrimp'] },
    { emoji: '🍙', keywords: ['rice', 'ball'] },
    { emoji: '🍚', keywords: ['cooked', 'rice'] },
    { emoji: '🍘', keywords: ['rice', 'cracker'] },
    { emoji: '🍥', keywords: ['fish', 'cake', 'swirl'] },
    { emoji: '🥠', keywords: ['fortune', 'cookie'] },
    { emoji: '🥮', keywords: ['moon', 'cake'] },
    { emoji: '🍢', keywords: ['oden'] },
    { emoji: '🍡', keywords: ['dango'] },
    { emoji: '🍧', keywords: ['shaved', 'ice'] },
    { emoji: '🍨', keywords: ['ice', 'cream'] },
    { emoji: '🍦', keywords: ['soft', 'ice', 'cream'] },
    { emoji: '🍰', keywords: ['shortcake', 'cake'] },
    { emoji: '🧁', keywords: ['cupcake'] },
    { emoji: '🥧', keywords: ['pie'] },
    { emoji: '🍮', keywords: ['custard'] },
    { emoji: '🍭', keywords: ['lollipop', 'candy'] },
    { emoji: '🍬', keywords: ['candy', 'sweet'] },
    { emoji: '🍫', keywords: ['chocolate', 'bar'] },
    { emoji: '🍿', keywords: ['popcorn'] },
    { emoji: '🍪', keywords: ['cookie'] },
    { emoji: '🌰', keywords: ['chestnut'] },
    { emoji: '🥜', keywords: ['peanuts', 'nuts'] },
    { emoji: '🍯', keywords: ['honey', 'pot'] },
    { emoji: '🥛', keywords: ['glass', 'milk'] },
    { emoji: '🍼', keywords: ['baby', 'bottle'] },
    { emoji: '🫖', keywords: ['teapot'] },

    // Activities & Objects
    { emoji: '⚽', keywords: ['soccer', 'ball', 'football'] },
    { emoji: '🏀', keywords: ['basketball'] },
    { emoji: '🏈', keywords: ['american', 'football'] },
    { emoji: '⚾', keywords: ['baseball'] },
    { emoji: '🥎', keywords: ['softball'] },
    { emoji: '🎾', keywords: ['tennis'] },
    { emoji: '🏐', keywords: ['volleyball'] },
    { emoji: '🏉', keywords: ['rugby', 'football'] },
    { emoji: '🥏', keywords: ['flying', 'disc', 'frisbee'] },
    { emoji: '🎱', keywords: ['pool', '8', 'ball'] },
    { emoji: '🪀', keywords: ['yo-yo'] },
    { emoji: '🏓', keywords: ['ping', 'pong', 'table', 'tennis'] },
    { emoji: '🏸', keywords: ['badminton'] },
    { emoji: '🏒', keywords: ['ice', 'hockey'] },
    { emoji: '🏑', keywords: ['field', 'hockey'] },
    { emoji: '🥍', keywords: ['lacrosse'] },
    { emoji: '🏏', keywords: ['cricket'] },
    { emoji: '🥅', keywords: ['goal', 'net'] },
    { emoji: '⛳', keywords: ['flag', 'hole', 'golf'] },
    { emoji: '🪁', keywords: ['kite'] },
    { emoji: '🏹', keywords: ['bow', 'arrow'] },
    { emoji: '🎣', keywords: ['fishing', 'pole'] },
    { emoji: '🤿', keywords: ['diving', 'mask'] },
    { emoji: '🥊', keywords: ['boxing', 'glove'] },
    { emoji: '🥋', keywords: ['martial', 'arts', 'uniform'] },
    { emoji: '🎽', keywords: ['running', 'shirt'] },
    { emoji: '🛹', keywords: ['skateboard'] },
    { emoji: '🛷', keywords: ['sled'] },
    { emoji: '⛸️', keywords: ['ice', 'skate'] },
    { emoji: '🥌', keywords: ['curling', 'stone'] },
    { emoji: '🎿', keywords: ['skis'] },
    { emoji: '⛷️', keywords: ['skier'] },
    { emoji: '🏂', keywords: ['snowboarder'] },
    { emoji: '🪂', keywords: ['parachute'] },
    { emoji: '🎭', keywords: ['performing', 'arts', 'theater'] },
    { emoji: '🩰', keywords: ['ballet', 'shoes'] },
    { emoji: '🎨', keywords: ['artist', 'palette', 'art'] },
    { emoji: '🎬', keywords: ['clapper', 'board', 'movie'] },
    { emoji: '🎤', keywords: ['microphone', 'singing'] },
    { emoji: '🎧', keywords: ['headphone', 'music'] },
    { emoji: '🎼', keywords: ['musical', 'score'] },
    { emoji: '🎹', keywords: ['musical', 'keyboard', 'piano'] },
    { emoji: '🥁', keywords: ['drum'] },
    { emoji: '🪘', keywords: ['long', 'drum'] },
    { emoji: '🎷', keywords: ['saxophone'] },
    { emoji: '🎺', keywords: ['trumpet'] },
    { emoji: '🎸', keywords: ['guitar'] },
    { emoji: '🪕', keywords: ['banjo'] },
    { emoji: '🎻', keywords: ['violin'] },
    { emoji: '🎲', keywords: ['game', 'die', 'dice'] },
    { emoji: '♟️', keywords: ['chess', 'pawn'] },
    { emoji: '🎯', keywords: ['direct', 'hit', 'target'] },
    { emoji: '🎳', keywords: ['bowling'] },
    { emoji: '🎮', keywords: ['video', 'game', 'controller'] },
    { emoji: '🎰', keywords: ['slot', 'machine'] },
    { emoji: '🧩', keywords: ['puzzle', 'piece'] },
    { emoji: '📱', keywords: ['mobile', 'phone', 'cell'] },

    // Travel & Places
    { emoji: '🚗', keywords: ['automobile', 'car'] },
    { emoji: '🚕', keywords: ['taxi'] },
    { emoji: '🚙', keywords: ['sport', 'utility', 'vehicle', 'suv'] },
    { emoji: '🚌', keywords: ['bus'] },
    { emoji: '🚎', keywords: ['trolleybus'] },
    { emoji: '🏎️', keywords: ['racing', 'car'] },
    { emoji: '🚓', keywords: ['police', 'car'] },
    { emoji: '🚑', keywords: ['ambulance'] },
    { emoji: '🚒', keywords: ['fire', 'engine'] },
    { emoji: '🚐', keywords: ['minibus'] },
    { emoji: '🚚', keywords: ['delivery', 'truck'] },
    { emoji: '🚛', keywords: ['articulated', 'lorry'] },
    { emoji: '🚜', keywords: ['tractor'] },
    { emoji: '🛴', keywords: ['kick', 'scooter'] },
    { emoji: '🛵', keywords: ['motor', 'scooter'] },
    { emoji: '🏍️', keywords: ['motorcycle'] },
    { emoji: '🚨', keywords: ['police', 'car', 'light'] },
    { emoji: '🚔', keywords: ['oncoming', 'police', 'car'] },
    { emoji: '🚍', keywords: ['oncoming', 'bus'] },
    { emoji: '🚘', keywords: ['oncoming', 'automobile'] },
    { emoji: '🚖', keywords: ['oncoming', 'taxi'] },
    { emoji: '🚡', keywords: ['aerial', 'tramway'] },
    { emoji: '🚠', keywords: ['mountain', 'cableway'] },
    { emoji: '🚟', keywords: ['suspension', 'railway'] },
    { emoji: '🚃', keywords: ['railway', 'car'] },
    { emoji: '🚋', keywords: ['tram', 'car'] },
    { emoji: '🚞', keywords: ['mountain', 'railway'] },
    { emoji: '🚝', keywords: ['monorail'] },
    { emoji: '🚄', keywords: ['high-speed', 'train'] },
    { emoji: '🚅', keywords: ['bullet', 'train'] },
    { emoji: '🚈', keywords: ['light', 'rail'] },
    { emoji: '🚂', keywords: ['locomotive'] },
    { emoji: '🚆', keywords: ['train'] },
    { emoji: '🚇', keywords: ['metro', 'subway'] },
    { emoji: '🚊', keywords: ['tram'] },
    { emoji: '🚉', keywords: ['station'] },
    { emoji: '✈️', keywords: ['airplane', 'plane', 'flight'] },
    { emoji: '🛫', keywords: ['airplane', 'departure'] },
    { emoji: '🛬', keywords: ['airplane', 'arrival'] },
    { emoji: '🛩️', keywords: ['small', 'airplane'] },
    { emoji: '💺', keywords: ['seat'] },
    { emoji: '🛰️', keywords: ['satellite'] },
    { emoji: '🚀', keywords: ['rocket', 'space'] },
    { emoji: '🛸', keywords: ['flying', 'saucer', 'ufo'] },
    { emoji: '🚁', keywords: ['helicopter'] },
    { emoji: '🛶', keywords: ['canoe'] },
    { emoji: '⛵', keywords: ['sailboat'] },
    { emoji: '🚤', keywords: ['speedboat'] },
    { emoji: '🛥️', keywords: ['motor', 'boat'] },
    { emoji: '🛳️', keywords: ['passenger', 'ship'] },
    { emoji: '⛴️', keywords: ['ferry'] },
    { emoji: '🚢', keywords: ['ship'] },
    { emoji: '⚓', keywords: ['anchor'] },
    { emoji: '🚧', keywords: ['construction'] },
    { emoji: '⛽', keywords: ['fuel', 'pump', 'gas'] },
    { emoji: '🚏', keywords: ['bus', 'stop'] },
    { emoji: '🚦', keywords: ['vertical', 'traffic', 'light'] },
    { emoji: '🚥', keywords: ['horizontal', 'traffic', 'light'] },
    { emoji: '🗺️', keywords: ['world', 'map'] },
    { emoji: '🗿', keywords: ['moai', 'statue'] },
    { emoji: '🗽', keywords: ['statue', 'liberty'] },
    { emoji: '🗼', keywords: ['tokyo', 'tower'] },
    { emoji: '🏰', keywords: ['castle'] },
    { emoji: '🏯', keywords: ['japanese', 'castle'] },
    { emoji: '🏟️', keywords: ['stadium'] },
    { emoji: '🎡', keywords: ['ferris', 'wheel'] },
    { emoji: '🎢', keywords: ['roller', 'coaster'] },
    { emoji: '🎠', keywords: ['carousel', 'horse'] },
    { emoji: '⛲', keywords: ['fountain'] },
    { emoji: '⛱️', keywords: ['umbrella', 'beach'] },
    { emoji: '🏖️', keywords: ['beach', 'umbrella'] },
    { emoji: '🏝️', keywords: ['desert', 'island'] },
    { emoji: '🏔️', keywords: ['snow-capped', 'mountain'] },
    { emoji: '🗻', keywords: ['mount', 'fuji'] },
    { emoji: '🌋', keywords: ['volcano'] },
    { emoji: '🗾', keywords: ['map', 'japan'] },
    { emoji: '🏕️', keywords: ['camping'] },
    { emoji: '⛺', keywords: ['tent'] },
    { emoji: '🏠', keywords: ['house'] },
    { emoji: '🏡', keywords: ['house', 'garden'] },
    { emoji: '🏘️', keywords: ['houses'] },
    { emoji: '🏚️', keywords: ['derelict', 'house'] },
    { emoji: '🏗️', keywords: ['building', 'construction'] },
    { emoji: '🏭', keywords: ['factory'] },
    { emoji: '🏢', keywords: ['office', 'building'] },
    { emoji: '🏬', keywords: ['department', 'store'] },
    { emoji: '🏣', keywords: ['japanese', 'post', 'office'] },
    { emoji: '🏤', keywords: ['post', 'office'] },
    { emoji: '🏥', keywords: ['hospital'] },
    { emoji: '🏦', keywords: ['bank'] },
    { emoji: '🏨', keywords: ['hotel'] },
    { emoji: '🏪', keywords: ['convenience', 'store'] },
    { emoji: '🏫', keywords: ['school'] },
    { emoji: '🏩', keywords: ['love', 'hotel'] },
    { emoji: '💒', keywords: ['wedding'] },
    { emoji: '⛪', keywords: ['church'] },

    // Symbols & Objects
    { emoji: '❤️', keywords: ['red', 'heart', 'love'] },
    { emoji: '🧡', keywords: ['orange', 'heart', 'love'] },
    { emoji: '💛', keywords: ['yellow', 'heart', 'love'] },
    { emoji: '💚', keywords: ['green', 'heart', 'love'] },
    { emoji: '💙', keywords: ['blue', 'heart', 'love'] },
    { emoji: '💜', keywords: ['purple', 'heart', 'love'] },
    { emoji: '🖤', keywords: ['black', 'heart', 'love'] },
    { emoji: '🤍', keywords: ['white', 'heart', 'love'] },
    { emoji: '🤎', keywords: ['brown', 'heart', 'love'] },
    { emoji: '💔', keywords: ['broken', 'heart', 'sad'] },
    { emoji: '❣️', keywords: ['heavy', 'heart', 'exclamation'] },
    { emoji: '💕', keywords: ['two', 'hearts', 'love'] },
    { emoji: '💞', keywords: ['revolving', 'hearts', 'love'] },
    { emoji: '💓', keywords: ['beating', 'heart', 'love'] },
    { emoji: '💗', keywords: ['growing', 'heart', 'love'] },
    { emoji: '💖', keywords: ['sparkling', 'heart', 'love'] },
    { emoji: '💘', keywords: ['heart', 'arrow', 'cupid'] },
    { emoji: '💝', keywords: ['heart', 'ribbon', 'gift'] },
    { emoji: '💟', keywords: ['heart', 'decoration'] },
    { emoji: '☮️', keywords: ['peace', 'symbol'] },
    { emoji: '✝️', keywords: ['latin', 'cross'] },
    { emoji: '☪️', keywords: ['star', 'crescent'] },
    { emoji: '🕉️', keywords: ['om'] },
    { emoji: '☸️', keywords: ['wheel', 'dharma'] },
    { emoji: '✡️', keywords: ['star', 'david'] },
    { emoji: '🔯', keywords: ['dotted', 'six-pointed', 'star'] },
    { emoji: '🕎', keywords: ['menorah'] },
    { emoji: '☯️', keywords: ['yin', 'yang'] },
    { emoji: '☦️', keywords: ['orthodox', 'cross'] },
    { emoji: '🛐', keywords: ['place', 'worship'] },
    { emoji: '⛎', keywords: ['ophiuchus'] },
    { emoji: '♈', keywords: ['aries'] },
    { emoji: '♉', keywords: ['taurus'] },
    { emoji: '♊', keywords: ['gemini'] },
    { emoji: '♋', keywords: ['cancer'] },
    { emoji: '♌', keywords: ['leo'] },
    { emoji: '♍', keywords: ['virgo'] },
    { emoji: '♎', keywords: ['libra'] },
    { emoji: '♏', keywords: ['scorpio'] },
    { emoji: '♐', keywords: ['sagittarius'] },
    { emoji: '♑', keywords: ['capricorn'] },
    { emoji: '♒', keywords: ['aquarius'] },
    { emoji: '♓', keywords: ['pisces'] },
    { emoji: '🆔', keywords: ['id', 'button'] },
    { emoji: '⚛️', keywords: ['atom', 'symbol'] },
    { emoji: '🉑', keywords: ['japanese', 'acceptable'] },
    { emoji: '☢️', keywords: ['radioactive'] },
    { emoji: '☣️', keywords: ['biohazard'] },
    { emoji: '📴', keywords: ['mobile', 'phone', 'off'] },
    { emoji: '📳', keywords: ['vibration', 'mode'] },
    { emoji: '🈶', keywords: ['japanese', 'not', 'free', 'charge'] },
    { emoji: '🈚', keywords: ['japanese', 'free', 'charge'] },
    { emoji: '🈸', keywords: ['japanese', 'application'] },
    { emoji: '🈺', keywords: ['japanese', 'open', 'business'] },
    { emoji: '🈷️', keywords: ['japanese', 'monthly', 'amount'] },
    { emoji: '✴️', keywords: ['eight-pointed', 'star'] },
    { emoji: '🆚', keywords: ['vs', 'button'] },
    { emoji: '💮', keywords: ['white', 'flower'] },
    { emoji: '🉐', keywords: ['japanese', 'bargain'] },
    { emoji: '㊙️', keywords: ['japanese', 'secret'] },
    { emoji: '㊗️', keywords: ['japanese', 'congratulations'] },
    { emoji: '🈴', keywords: ['japanese', 'passing', 'grade'] },
    { emoji: '🈵', keywords: ['japanese', 'no', 'vacancy'] },
    { emoji: '🈹', keywords: ['japanese', 'discount'] },
    { emoji: '🈲', keywords: ['japanese', 'prohibited'] },
    { emoji: '🅰️', keywords: ['a', 'button', 'blood', 'type'] },
    { emoji: '🅱️', keywords: ['b', 'button', 'blood', 'type'] },
    { emoji: '🆎', keywords: ['ab', 'button', 'blood', 'type'] },
    { emoji: '🆑', keywords: ['cl', 'button'] },
    { emoji: '🅾️', keywords: ['o', 'button', 'blood', 'type'] },
    { emoji: '🆘', keywords: ['sos', 'button'] },
    { emoji: '❌', keywords: ['cross', 'mark', 'no', 'x'] },
    { emoji: '⭕', keywords: ['heavy', 'large', 'circle'] },
    { emoji: '🛑', keywords: ['stop', 'sign'] },
    { emoji: '⛔', keywords: ['no', 'entry'] },
    { emoji: '📛', keywords: ['name', 'badge'] },
    { emoji: '🚫', keywords: ['prohibited'] },
    { emoji: '💯', keywords: ['hundred', 'points', 'perfect'] },
    { emoji: '💢', keywords: ['anger', 'symbol'] },
    { emoji: '♨️', keywords: ['hot', 'springs'] },
    { emoji: '🚷', keywords: ['no', 'pedestrians'] },
    { emoji: '🚯', keywords: ['no', 'littering'] },
    { emoji: '🚳', keywords: ['no', 'bicycles'] },
    { emoji: '🚱', keywords: ['non-potable', 'water'] },
    { emoji: '🔞', keywords: ['no', 'one', 'under', 'eighteen'] },
    { emoji: '📵', keywords: ['no', 'mobile', 'phones'] },
    { emoji: '🚭', keywords: ['no', 'smoking'] },
    { emoji: '❗', keywords: ['exclamation', 'mark'] },
    { emoji: '❕', keywords: ['white', 'exclamation', 'mark'] },
    { emoji: '❓', keywords: ['question', 'mark'] },
    { emoji: '❔', keywords: ['white', 'question', 'mark'] },
    { emoji: '‼️', keywords: ['double', 'exclamation', 'mark'] },
    { emoji: '⁉️', keywords: ['exclamation', 'question', 'mark'] },
    { emoji: '🔅', keywords: ['dim', 'button'] },
    { emoji: '🔆', keywords: ['bright', 'button'] },
    { emoji: '〽️', keywords: ['part', 'alternation', 'mark'] },

    // Flags & Misc
    { emoji: '🏁', keywords: ['chequered', 'flag', 'racing'] },
    { emoji: '🚩', keywords: ['triangular', 'flag'] },
    { emoji: '🎌', keywords: ['crossed', 'flags'] },
    { emoji: '🏴', keywords: ['black', 'flag'] },
    { emoji: '🏳️', keywords: ['white', 'flag'] },
    { emoji: '🏳️‍🌈', keywords: ['rainbow', 'flag', 'pride'] },
    { emoji: '🏴‍☠️', keywords: ['pirate', 'flag'] },
    { emoji: '🎉', keywords: ['party', 'popper', 'celebration'] },
    { emoji: '🎊', keywords: ['confetti', 'ball', 'celebration'] },
    { emoji: '🎈', keywords: ['balloon', 'party'] },
    { emoji: '🎂', keywords: ['birthday', 'cake'] },
    { emoji: '🎁', keywords: ['wrapped', 'gift', 'present'] },
    { emoji: '🎄', keywords: ['christmas', 'tree'] },
    { emoji: '🎃', keywords: ['jack-o-lantern', 'halloween'] },
    { emoji: '🎗️', keywords: ['reminder', 'ribbon'] },
    { emoji: '🎟️', keywords: ['admission', 'tickets'] },
    { emoji: '🎫', keywords: ['ticket'] },
    { emoji: '🎖️', keywords: ['military', 'medal'] },
    { emoji: '🏆', keywords: ['trophy', 'winner'] },
    { emoji: '🏅', keywords: ['sports', 'medal'] },
    { emoji: '🥇', keywords: ['1st', 'place', 'medal', 'gold'] },
    { emoji: '🥈', keywords: ['2nd', 'place', 'medal', 'silver'] },
    { emoji: '🥉', keywords: ['3rd', 'place', 'medal', 'bronze'] },
    { emoji: '🔥', keywords: ['fire', 'hot', 'lit'] },
    { emoji: '💯', keywords: ['hundred', 'points', 'perfect', '100'] },
    { emoji: '✨', keywords: ['sparkles', 'magic', 'shiny'] },
    { emoji: '🌟', keywords: ['glowing', 'star'] },
    { emoji: '💫', keywords: ['dizzy'] },
    { emoji: '⭐', keywords: ['star'] },
    { emoji: '💥', keywords: ['collision', 'explosion'] },
    { emoji: '⚡', keywords: ['high', 'voltage', 'lightning'] },
    { emoji: '💦', keywords: ['sweat', 'droplets'] },
    { emoji: '💨', keywords: ['dashing', 'away', 'wind'] },
    { emoji: '☁️', keywords: ['cloud'] },
    { emoji: '🌤️', keywords: ['sun', 'behind', 'small', 'cloud'] },
    { emoji: '⛅', keywords: ['sun', 'behind', 'cloud'] },
    { emoji: '🌥️', keywords: ['sun', 'behind', 'large', 'cloud'] },
    { emoji: '🌦️', keywords: ['sun', 'behind', 'rain', 'cloud'] },
    { emoji: '🌧️', keywords: ['cloud', 'rain'] },
    { emoji: '⛈️', keywords: ['cloud', 'lightning', 'rain'] },
    { emoji: '🌩️', keywords: ['cloud', 'lightning'] },
    { emoji: '🌨️', keywords: ['cloud', 'snow'] },
    { emoji: '☃️', keywords: ['snowman'] },
    { emoji: '⛄', keywords: ['snowman', 'without', 'snow'] },
    { emoji: '🌬️', keywords: ['wind', 'face'] },
    { emoji: '🌪️', keywords: ['tornado'] },
    { emoji: '🌫️', keywords: ['fog'] },
    { emoji: '🌊', keywords: ['water', 'wave'] },
    { emoji: '💧', keywords: ['droplet', 'water'] },
    { emoji: '☔', keywords: ['umbrella', 'rain', 'drops'] },
    { emoji: '☂️', keywords: ['umbrella'] },
    { emoji: '🌂', keywords: ['closed', 'umbrella'] }
  ];

  // Filter emojis based on search term
  const getFilteredEmojis = (searchTerm) => {
    if (!searchTerm.trim()) {
      return emojiData.map(item => item.emoji);
    }
    
    const lowercaseSearch = searchTerm.toLowerCase();
    return emojiData
      .filter(item => 
        item.keywords.some(keyword => 
          keyword.toLowerCase().includes(lowercaseSearch)
        )
      )
      .map(item => item.emoji);
  };

  // Export chat modal state
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportAppointment, setExportAppointment] = useState(null);
  const [exportComments, setExportComments] = useState([]);
  const [exportCallHistory, setExportCallHistory] = useState([]);

  // Call History modal state
  const [showCallHistoryModal, setShowCallHistoryModal] = useState(false);
  const [callHistoryAppointmentId, setCallHistoryAppointmentId] = useState(null);

   // Lock body scroll when admin action modals are open (cancel, reinitiate, archive, unarchive)
   useEffect(() => {
     const shouldLock = showCancelModal || showReinitiateModal || showArchiveModal || showUnarchiveModal;
     if (shouldLock) {
       document.body.classList.add('modal-open');
     } else {
       document.body.classList.remove('modal-open');
     }
     return () => {
       document.body.classList.remove('modal-open');
     };
   }, [showCancelModal, showReinitiateModal, showArchiveModal, showUnarchiveModal]);

   // Close audio menus when clicking outside
   useEffect(() => {
     const handleClickOutside = (event) => {
       if (!event.target.closest('[data-audio-menu]') && 
           !event.target.closest('[data-audio-speed-menu]') && 
           !event.target.closest('[data-audio-controls-menu]') && 
           !event.target.closest('button[title="Audio options"]')) {
         document.querySelectorAll('[data-audio-menu]').forEach(menu => {
           menu.classList.add('hidden');
         });
         document.querySelectorAll('[data-audio-speed-menu]').forEach(menu => {
           menu.classList.add('hidden');
         });
         document.querySelectorAll('[data-audio-controls-menu]').forEach(menu => {
           menu.classList.add('hidden');
         });
       }
     };

     document.addEventListener('click', handleClickOutside);
     return () => {
       document.removeEventListener('click', handleClickOutside);
     };
   }, []);

   // Handle direct chat link via URL parameter
   useEffect(() => {
     // Clear any previous timers when dependencies change
     if (chatIntervalRef.current) {
       clearInterval(chatIntervalRef.current);
       chatIntervalRef.current = null;
     }
     if (chatTimeoutRef.current) {
       clearTimeout(chatTimeoutRef.current);
       chatTimeoutRef.current = null;
     }
     chatResolveRef.current = false;

     // Handle direct chat link via URL parameter
     if (params.chatId) {
       const chatIdFromUrl = params.chatId;

       const tryResolveChat = () => {
         const appointment = appointments.find(appt => appt._id === chatIdFromUrl);
         if (appointment) {
           chatResolveRef.current = true;
           setShouldOpenChatFromNotification(true);
           setActiveChatAppointmentId(chatIdFromUrl);
           if (chatIntervalRef.current) clearInterval(chatIntervalRef.current);
           if (chatTimeoutRef.current) clearTimeout(chatTimeoutRef.current);
         }
       };

       if (appointments.length > 0) {
         tryResolveChat();
       } else {
         // Poll until appointments are available
         chatIntervalRef.current = setInterval(() => {
           if (appointments.length > 0) {
             tryResolveChat();
             if (chatIntervalRef.current) clearInterval(chatIntervalRef.current);
           }
         }, 100);
       }

       // Fallback after 5s if still unresolved
       chatTimeoutRef.current = setTimeout(() => {
         if (chatIntervalRef.current) clearInterval(chatIntervalRef.current);
         if (!chatResolveRef.current) {
           setMissingChatbookError(chatIdFromUrl);
         }
       }, 5000);
     }

     return () => {
       if (chatIntervalRef.current) clearInterval(chatIntervalRef.current);
       if (chatTimeoutRef.current) clearTimeout(chatTimeoutRef.current);
     };
   }, [params.chatId, appointments]);
 
   // Add state to track updated comments for each appointment
  // REMOVED: updatedComments state - no longer needed, using appointments array directly
  
  // Add ref to prevent infinite loops in comment updates
  const isUpdatingCommentsRef = useRef(false);

  // Function to update comments for a specific appointment
  const updateAppointmentComments = useCallback((appointmentId, comments) => {
    // Prevent infinite loops
    if (isUpdatingCommentsRef.current) {
      return;
    }
    
    // CRITICAL FIX: Update appointments array directly instead of separate updatedComments state
    setAppointments(prev => {
      const updated = prev.map(appt => {
        if (appt._id === appointmentId) {
          // Only update if there are actual changes
          if (JSON.stringify(appt.comments) !== JSON.stringify(comments)) {
            // Set flag to prevent infinite loops
            isUpdatingCommentsRef.current = true;
            
            // Reset flag after a short delay
            setTimeout(() => {
              isUpdatingCommentsRef.current = false;
            }, 100);
            
            return { ...appt, comments };
          }
        }
        return appt;
      });
      return updated;
    });
    
    // Also update archived appointments if needed
    setArchivedAppointments(prev => {
      const updated = prev.map(appt => {
        if (appt._id === appointmentId) {
          // Only update if there are actual changes
          if (JSON.stringify(appt.comments) !== JSON.stringify(comments)) {
            return { ...appt, comments };
          }
        }
        return appt;
      });
      return updated;
    });
  }, []);

  // Define fetch functions outside useEffect so they can be used in socket handlers
  const fetchAppointments = useCallback(async () => {
    try {
      // Fetch all appointments without pagination
      const { data } = await axios.get(`${API_BASE_URL}/api/bookings`, { 
        withCredentials: true 
      });
      const allAppts = data.appointments || data;
      setAllAppointments(allAppts);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch appointments", err);
      setLoading(false);
    }
  }, []);

  const fetchArchivedAppointments = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_BASE_URL}/api/bookings/archived`, {
        withCredentials: true
      });
      setArchivedAppointments(data);
    } catch (err) {
      console.error("Failed to fetch archived appointments", err);
    }
  }, []);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    // Join admin appointments room to receive real-time updates
    if (socket.connected && currentUser) {
      socket.emit('adminAppointmentsActive', { 
        adminId: currentUser._id,
        role: currentUser.role 
      });
    }

    // Emit adminAppointmentsActive periodically to stay subscribed (reduced frequency)
    const adminInterval = setInterval(() => {
      if (currentUser) {
        socket.emit('adminAppointmentsActive', { 
          adminId: currentUser._id,
          role: currentUser.role 
        });
      }
    }, 30000); // Changed from 1000ms to 30000ms (30 seconds)
    
    fetchAppointments();
    fetchArchivedAppointments();
    // Removed periodic refresh interval - appointments are updated via socket events in real-time
    // No need to poll every 5 seconds, which was causing unnecessary message refreshes in chatbox
    // Real-time updates are handled by socket events (commentUpdate, appointmentUpdate, etc.)
    
    // Listen for profile updates to update user info in appointments
    const handleProfileUpdate = (profileData) => {
      setAppointments(prevAppointments => prevAppointments.map(appt => {
        const updated = { ...appt };
        
        // Update buyer info if the updated user is the buyer
        if (appt.buyerId && (appt.buyerId._id === profileData.userId || appt.buyerId === profileData.userId)) {
          updated.buyerId = {
            ...updated.buyerId,
            username: profileData.username,
            email: profileData.email,
            mobileNumber: profileData.mobileNumber,
            avatar: profileData.avatar
          };
        }
        
        // Update seller info if the updated user is the seller
        if (appt.sellerId && (appt.sellerId._id === profileData.userId || appt.sellerId === profileData.userId)) {
          updated.sellerId = {
            ...updated.sellerId,
            username: profileData.username,
            email: profileData.email,
            mobileNumber: profileData.mobileNumber,
            avatar: profileData.avatar
          };
        }
        
        return updated;
      }));
      
      setArchivedAppointments(prevArchived => prevArchived.map(appt => {
        const updated = { ...appt };
        
        // Update buyer info if the updated user is the buyer
        if (appt.buyerId && (appt.buyerId._id === profileData.userId || appt.buyerId === profileData.userId)) {
          updated.buyerId = {
            ...updated.buyerId,
            username: profileData.username,
            email: profileData.email,
            mobileNumber: profileData.mobileNumber,
            avatar: profileData.avatar
          };
        }
        
        // Update seller info if the updated user is the seller
        if (appt.sellerId && (appt.sellerId._id === profileData.userId || appt.sellerId === profileData.userId)) {
          updated.sellerId = {
            ...updated.sellerId,
            username: profileData.username,
            email: profileData.email,
            mobileNumber: profileData.mobileNumber,
            avatar: profileData.avatar
          };
        }
        
        return updated;
      }));
    };
    socket.on('profileUpdated', handleProfileUpdate);

    // Listen for real-time comment updates to refresh appointments
    const handleCommentUpdate = (data) => {
      // Skip handling if this is a message sent by current admin user to prevent duplicates
      // Admin messages are already added locally in handleCommentSend
      if (data.comment.senderEmail === currentUser?.email) {
        return;
      }
      
      // Update the specific appointment's comments in real-time
      setAppointments(prev => 
        prev.map(appt => {
          if (appt._id === data.appointmentId) {
            // Find if comment already exists
            const existingCommentIndex = appt.comments?.findIndex(c => c._id === data.comment._id);
            if (existingCommentIndex !== -1) {
              // Update existing comment - only if there are actual changes
              // and preserve starred status and media URLs for deleted messages
              const existingComment = appt.comments[existingCommentIndex];
              const updatedComment = { 
                ...data.comment, 
                starredBy: existingComment.starredBy || [],
                // Preserve media URLs if the message is being deleted and they're not in the update
                videoUrl: data.comment.videoUrl || existingComment.videoUrl,
                audioUrl: data.comment.audioUrl || existingComment.audioUrl,
                audioName: data.comment.audioName || existingComment.audioName,
                documentUrl: data.comment.documentUrl || existingComment.documentUrl,
                documentName: data.comment.documentName || existingComment.documentName,
                originalImageUrl: data.comment.originalImageUrl || existingComment.originalImageUrl || existingComment.imageUrl,
                imageUrl: data.comment.imageUrl || existingComment.imageUrl
              };
              if (JSON.stringify(existingComment) !== JSON.stringify(updatedComment)) {
                const updatedComments = [...(appt.comments || [])];
                updatedComments[existingCommentIndex] = updatedComment;
                try { playMessageReceived(); } catch(_) {}
                return { ...appt, comments: updatedComments };
              }
              return appt; // No changes needed
            } else {
              // Add new comment - this is a new user message
              const updatedComments = [...(appt.comments || []), data.comment];
              try { playMessageReceived(); } catch(_) {}
              return { ...appt, comments: updatedComments };
            }
          }
          return appt;
        })
      );
      
      // Also update archived appointments if needed
      setArchivedAppointments(prev => 
        prev.map(appt => {
          if (appt._id === data.appointmentId) {
            const existingCommentIndex = appt.comments?.findIndex(c => c._id === data.comment._id);
            if (existingCommentIndex !== -1) {
              // Update existing comment - only if there are actual changes
              // and preserve starred status and media URLs for deleted messages
              const existingComment = appt.comments[existingCommentIndex];
              const updatedComment = { 
                ...data.comment, 
                starredBy: existingComment.starredBy || [],
                // Preserve media URLs if the message is being deleted and they're not in the update
                videoUrl: data.comment.videoUrl || existingComment.videoUrl,
                audioUrl: data.comment.audioUrl || existingComment.audioUrl,
                audioName: data.comment.audioName || existingComment.audioName,
                documentUrl: data.comment.documentUrl || existingComment.documentUrl,
                documentName: data.comment.documentName || existingComment.documentName,
                originalImageUrl: data.comment.originalImageUrl || existingComment.originalImageUrl || existingComment.imageUrl,
                imageUrl: data.comment.imageUrl || existingComment.imageUrl
              };
              if (JSON.stringify(existingComment) !== JSON.stringify(updatedComment)) {
                const updatedComments = [...(appt.comments || [])];
                updatedComments[existingCommentIndex] = updatedComment;
                try { playMessageReceived(); } catch(_) {}
                return { ...appt, comments: updatedComments };
              }
              return appt; // No changes needed
            } else {
              // Add new comment
              const updatedComments = [...(appt.comments || []), data.comment];
              try { playMessageReceived(); } catch(_) {}
              return { ...appt, comments: updatedComments };
            }
          }
          return appt;
        })
      );

      // REMOVED: updatedComments state update that was causing race conditions
      // The appointments array is already updated above, no need for separate state
    };
    socket.on('commentUpdate', handleCommentUpdate);

    // Listen for appointment updates
    const handleAppointmentUpdate = (data) => {
      setAppointments(prev => 
        prev.map(appt => 
          appt._id === data.appointmentId ? { ...appt, ...data.updatedAppointment } : appt
        )
      );
      setArchivedAppointments(prev => 
        prev.map(appt => 
          appt._id === data.appointmentId ? { ...appt, ...data.updatedAppointment } : appt
        )
      );
    };
    
    // Listen for payment status updates
    const handlePaymentStatusUpdate = (data) => {
      setAppointments(prev => 
        prev.map(appt => 
          appt._id === data.appointmentId ? { ...appt, paymentConfirmed: data.paymentConfirmed } : appt
        )
      );
      setArchivedAppointments(prev => 
        prev.map(appt => 
          appt._id === data.appointmentId ? { ...appt, paymentConfirmed: data.paymentConfirmed } : appt
        )
      );
    };
    
    socket.on('appointmentUpdate', handleAppointmentUpdate);
    socket.on('paymentStatusUpdated', handlePaymentStatusUpdate);

    // Listen for new appointments
    const handleAppointmentCreated = (data) => {
      const newAppt = data.appointment;
      setAppointments(prev => [newAppt, ...prev]);
    };
    socket.on('appointmentCreated', handleAppointmentCreated);

    // Listen for socket connection events
    const handleConnect = () => {
      // Re-join admin appointments rooms on reconnect to receive real-time updates
      // The interval will handle periodic emissions, so we only emit once on reconnect
      if (currentUser) {
        socket.emit('adminAppointmentsActive', { 
          adminId: currentUser._id,
          role: currentUser.role 
        });
      }
    };
    const handleDisconnect = () => {
      // Socket disconnected - will auto-reconnect
    };
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    
    return () => {
      // Interval removed - no cleanup needed
      clearInterval(adminInterval);
      socket.off('profileUpdated', handleProfileUpdate);
      socket.off('commentUpdate', handleCommentUpdate);
      socket.off('appointmentUpdate', handleAppointmentUpdate);
      socket.off('paymentStatusUpdated', handlePaymentStatusUpdate);
      socket.off('appointmentCreated', handleAppointmentCreated);
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, [fetchAppointments, fetchArchivedAppointments, currentUser]);

  // Separate useEffect for pagination and filtering
  useEffect(() => {
    if (allAppointments.length === 0) return;
    
    // Apply filters
    let filteredAppts = allAppointments.filter((appt) => {
      const isOutdated = new Date(appt.date) < new Date() || (new Date(appt.date).toDateString() === new Date().toDateString() && appt.time && appt.time < new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      const matchesStatus =
        statusFilter === "all" ? true :
        statusFilter === "outdated" ? isOutdated :
        appt.status === statusFilter;
      const matchesSearch =
        appt.buyerId?.email?.toLowerCase().includes(search.toLowerCase()) ||
        appt.sellerId?.email?.toLowerCase().includes(search.toLowerCase()) ||
        appt.buyerId?.username?.toLowerCase().includes(search.toLowerCase()) ||
        appt.sellerId?.username?.toLowerCase().includes(search.toLowerCase()) ||
        appt.propertyName?.toLowerCase().includes(search.toLowerCase());
      const matchesDateRange = 
        (!startDate || new Date(appt.date) >= new Date(startDate)) &&
        (!endDate || new Date(appt.date) <= new Date(endDate));
      
      return matchesStatus && matchesSearch && matchesDateRange;
    });
    
    // Calculate pagination
    const itemsPerPage = 10;
    const totalPages = Math.ceil(filteredAppts.length / itemsPerPage);
    setTotalPages(totalPages);
    
    // Get current page items
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentPageAppts = filteredAppts.slice(startIndex, endIndex);
    
    setAppointments(currentPageAppts);
  }, [allAppointments, currentPage, search, statusFilter, startDate, endDate]);

  // Separate useEffect for archived appointments pagination and filtering
  useEffect(() => {
    if (archivedAppointments.length === 0) return;
    
    // Apply filters to archived appointments
    let filteredArchivedAppts = archivedAppointments.filter((appt) => {
      const isOutdated = new Date(appt.date) < new Date() || (new Date(appt.date).toDateString() === new Date().toDateString() && appt.time && appt.time < new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      const matchesStatus =
        statusFilter === "all" ? true :
        statusFilter === "outdated" ? isOutdated :
        appt.status === statusFilter;
      const matchesSearch =
        appt.buyerId?.email?.toLowerCase().includes(search.toLowerCase()) ||
        appt.sellerId?.email?.toLowerCase().includes(search.toLowerCase()) ||
        appt.buyerId?.username?.toLowerCase().includes(search.toLowerCase()) ||
        appt.sellerId?.username?.toLowerCase().includes(search.toLowerCase()) ||
        appt.propertyName?.toLowerCase().includes(search.toLowerCase());
      const matchesDateRange = 
        (!startDate || new Date(appt.date) >= new Date(startDate)) &&
        (!endDate || new Date(appt.date) <= new Date(endDate));
      
      return matchesStatus && matchesSearch && matchesDateRange;
    });
    
    // Calculate pagination for archived appointments
    const itemsPerPage = 10;
    const totalPages = Math.ceil(filteredArchivedAppts.length / itemsPerPage);
    setArchivedTotalPages(totalPages);
    
    // Get current page items for archived appointments
    const startIndex = (archivedCurrentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentPageArchivedAppts = filteredArchivedAppts.slice(startIndex, endIndex);
    
    setFilteredArchivedAppointments(currentPageArchivedAppts);
  }, [archivedAppointments, archivedCurrentPage, search, statusFilter, startDate, endDate]);

  // Lock background scroll when user modal is open
  useEffect(() => {
    if (showUserModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showUserModal]);

  // Dynamically update user info in appointments when currentUser changes
  useEffect(() => {
    if (!currentUser) return;
    setAppointments(prevAppointments => prevAppointments.map(appt => {
      const updated = { ...appt };
      
      // Update buyer info if current user is the buyer
      if (appt.buyerId && (appt.buyerId._id === currentUser._id || appt.buyerId === currentUser._id)) {
        updated.buyerId = {
          ...updated.buyerId,
          username: currentUser.username,
          email: currentUser.email,
          mobileNumber: currentUser.mobileNumber,
          avatar: currentUser.avatar
        };
      }
      
      // Update seller info if current user is the seller
      if (appt.sellerId && (appt.sellerId._id === currentUser._id || appt.sellerId === currentUser._id)) {
        updated.sellerId = {
          ...updated.sellerId,
          username: currentUser.username,
          email: currentUser.email,
          mobileNumber: currentUser.mobileNumber,
          avatar: currentUser.avatar
        };
      }
      
      return updated;
    }));
    
    setArchivedAppointments(prevArchived => prevArchived.map(appt => {
      const updated = { ...appt };
      
      // Update buyer info if current user is the buyer
      if (appt.buyerId && (appt.buyerId._id === currentUser._id || appt.buyerId === currentUser._id)) {
        updated.buyerId = {
          ...updated.buyerId,
          username: currentUser.username,
          email: currentUser.email,
          mobileNumber: currentUser.mobileNumber,
          avatar: currentUser.avatar
        };
      }
      
      // Update seller info if current user is the seller
      if (appt.sellerId && (appt.sellerId._id === currentUser._id || appt.sellerId === currentUser._id)) {
        updated.sellerId = {
          ...updated.sellerId,
          username: currentUser.username,
          email: currentUser.email,
          mobileNumber: currentUser.mobileNumber,
          avatar: currentUser.avatar
        };
      }
      
      return updated;
    }));
  }, [currentUser]);

  const handleAdminCancel = async (id) => {
    setAppointmentToHandle(id);
    setCancelReason('');
    setShowCancelModal(true);
    // Close reactions bar when admin action modal opens
    setShowReactionsBar(false);
    setReactionsMessageId(null);
  };

  const confirmAdminCancel = async () => {
    if (!cancelReason.trim()) {
      toast.error('Please provide a reason for cancelling this appointment.');
      return;
    }
    
    try {
      const { data } = await axios.patch(`${API_BASE_URL}/api/bookings/${appointmentToHandle}/cancel`, 
        { reason: cancelReason },
        { 
          withCredentials: true,
          headers: { "Content-Type": "application/json" }
        }
      );
      
      setAppointments((prev) =>
        prev.map((appt) => (appt._id === appointmentToHandle ? { ...appt, status: "cancelledByAdmin", cancelReason: cancelReason } : appt))
      );
      toast.success("Appointment cancelled successfully. Both buyer and seller have been notified of the cancellation.");
      
      // Close modal and reset state
      setShowCancelModal(false);
      setAppointmentToHandle(null);
      setCancelReason('');
    } catch (err) {
      console.error('Error in confirmAdminCancel:', err);
      toast.error(err.response?.data?.message || "Failed to cancel appointment.");
    }
  };

  const handleReinitiateAppointment = async (id) => {
    // Fetch payment status to check if refunded
    let paymentStatus = null;
    try {
      const response = await fetch(`${API_BASE_URL}/api/payments/history?appointmentId=${id}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        if (data.payments && data.payments.length > 0) {
          paymentStatus = data.payments[0];
        }
      }
    } catch (error) {
      console.error('Error fetching payment status:', error);
    }

    setReinitiatePaymentStatus(paymentStatus);
    setAppointmentToHandle(id);
    setShowReinitiateModal(true);
    // Close reactions bar when admin action modal opens
    setShowReactionsBar(false);
    setReactionsMessageId(null);
  };

  const confirmReinitiate = async () => {
    // Get the appointment to check status
    const appt = appointments.find(a => a._id === appointmentToHandle);
    
    // Check if payment is refunded for cancelled appointment
    if (appt && (appt.status === 'cancelledByBuyer' || appt.status === 'cancelledBySeller' || appt.status === 'cancelledByAdmin')) {
      if (reinitiatePaymentStatus && (reinitiatePaymentStatus.status === 'refunded' || reinitiatePaymentStatus.status === 'partially_refunded')) {
        toast.error('Reinitiation disabled: The buyer has already received a refund for this appointment.');
        setShowReinitiateModal(false);
        setAppointmentToHandle(null);
        setReinitiatePaymentStatus(null);
        return;
      }
    }

    try {
      const { data } = await axios.patch(`${API_BASE_URL}/api/bookings/${appointmentToHandle}/reinitiate`, 
        {},
        { 
          withCredentials: true,
          headers: { "Content-Type": "application/json" }
        }
      );
      
      setAppointments((prev) =>
        prev.map((appt) => (appt._id === appointmentToHandle ? { ...appt, status: "pending", cancelReason: "" } : appt))
      );
      toast.success("Appointment reinitiated successfully. Both buyer and seller have been notified.");
      
      // Close modal and reset state
      setShowReinitiateModal(false);
      setAppointmentToHandle(null);
      setReinitiatePaymentStatus(null);
    } catch (err) {
      console.error('Error in confirmReinitiate:', err);
      toast.error(err.response?.data?.message || "Failed to reinitiate appointment.");
    }
  };

  const handleArchiveAppointment = async (id) => {
    setAppointmentToHandle(id);
    setShowArchiveModal(true);
    // Close reactions bar when admin action modal opens
    setShowReactionsBar(false);
    setReactionsMessageId(null);
  };

  const confirmArchive = async () => {
    try {
      const { data } = await axios.patch(`${API_BASE_URL}/api/bookings/${appointmentToHandle}/archive`, 
        {},
        { 
          withCredentials: true,
          headers: { "Content-Type": "application/json" }
        }
      );
      
      // Remove from active appointments and add to archived
      const archivedAppt = appointments.find(appt => appt._id === appointmentToHandle);
      if (archivedAppt) {
        setAppointments((prev) => prev.filter((appt) => appt._id !== appointmentToHandle));
        setArchivedAppointments((prev) => [{ ...archivedAppt, archivedByAdmin: true, archivedAt: new Date() }, ...prev]);
      }
      toast.success("Appointment archived successfully.");
      
      // Close modal and reset state
      setShowArchiveModal(false);
      setAppointmentToHandle(null);
    } catch (err) {
      console.error('Error in confirmArchive:', err);
      toast.error(err.response?.data?.message || "Failed to archive appointment.");
    }
  };

  const handleUnarchiveAppointment = async (id) => {
    setAppointmentToHandle(id);
    setShowUnarchiveModal(true);
    // Close reactions bar when admin action modal opens
    setShowReactionsBar(false);
    setReactionsMessageId(null);
  };

  const confirmUnarchive = async () => {
    try {
      const { data } = await axios.patch(`${API_BASE_URL}/api/bookings/${appointmentToHandle}/unarchive`, 
        {},
        { 
          withCredentials: true,
          headers: { "Content-Type": "application/json" }
        }
      );
      
      // Remove from archived appointments and add back to active
      const unarchivedAppt = archivedAppointments.find(appt => appt._id === appointmentToHandle);
      if (unarchivedAppt) {
        setArchivedAppointments((prev) => prev.filter((appt) => appt._id !== appointmentToHandle));
        setAppointments((prev) => [{ ...unarchivedAppt, archivedByAdmin: false, archivedAt: undefined }, ...prev]);
      }
      toast.success("Appointment unarchived successfully.");
      
      // Close modal and reset state
      setShowUnarchiveModal(false);
      setAppointmentToHandle(null);
    } catch (err) {
      console.error('Error in confirmUnarchive:', err);
      toast.error(err.response?.data?.message || "Failed to unarchive appointment.");
    }
  };

  const handleUserClick = async (userId) => {
    if (!userId) {
      toast.error("User ID not available");
      return;
    }
    
    setUserLoading(true);
    setShowUserModal(true);
    // Close reactions bar when user modal opens
    setShowReactionsBar(false);
    setReactionsMessageId(null);
    try {
      const { data } = await axios.get(`${API_BASE_URL}/api/user/id/${userId}`);
      setSelectedUser(data);
    } catch (err) {
      toast.error("Failed to fetch user details.");
      setShowUserModal(false);
    }
    setUserLoading(false);
  };

  // CRITICAL FIX: Use appointments directly since socket updates them in real-time
  // Remove the updatedComments override that was causing race conditions
  const appointmentsWithComments = appointments.map((appt) => ({
    ...appt,
    comments: appt.comments || []
  }));

  // CRITICAL FIX: Use filteredArchivedAppointments directly since socket updates them in real-time
  // Remove the updatedComments override that was causing race conditions
  const archivedAppointmentsWithComments = filteredArchivedAppointments.map((appt) => ({
    ...appt,
    comments: appt.comments || []
  }));

  // Add this function to fetch latest data on demand
  const handleManualRefresh = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_BASE_URL}/api/bookings`, { 
        withCredentials: true 
      });
      setAppointments(data);
      
      const { data: archivedData } = await axios.get(`${API_BASE_URL}/api/bookings/archived`, { 
        withCredentials: true 
      });
      setArchivedAppointments(Array.isArray(archivedData) ? archivedData : []);
    } catch (err) {
      // Optionally handle error
    } finally {
      setLoading(false);
    }
  };

  // Function to copy message to clipboard
  const copyMessageToClipboard = (messageText) => {
    if (!messageText) {
      toast.error('No message to copy');
      return;
    }
    
    // Try modern clipboard API first
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(messageText)
        .then(() => {
          toast.success('Copied', {
            autoClose: 2000,
            position: 'bottom-center'
          });
        })
        .catch(() => {
          // Fallback to older method
          copyWithFallback(messageText);
        });
    } else {
      // Use fallback method for older browsers
      copyWithFallback(messageText);
    }
  };

  // Fallback copy method
  const copyWithFallback = (text) => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (success) {
        toast.success('Copied', {
          autoClose: 2000,
          position: 'bottom-center'
        });
      } else {
        console.error('Fallback copy failed');
        toast.error('Failed to copy message');
      }
    } catch (err) {
      console.error('Fallback copy error:', err);
      toast.error('Copy not supported');
    }
  };

  // Reactions functionality functions
  const toggleReactionsBar = useCallback((messageId) => {
    if (reactionsMessageId === messageId && showReactionsBar) {
      setShowReactionsBar(false);
      setReactionsMessageId(null);
    } else {
      setShowReactionsBar(true);
      setReactionsMessageId(messageId);
    }
  }, [reactionsMessageId, showReactionsBar]);

  const toggleReactionsEmojiPicker = useCallback(() => {
    setShowReactionsEmojiPicker(prev => !prev);
  }, []);

  // Admin-wide Reports (top-bar)
  const [showAdminReportsModal, setShowAdminReportsModal] = useState(false);
  const [adminReports, setAdminReports] = useState([]);
  const [adminReportsLoading, setAdminReportsLoading] = useState(false);
  const [adminReportsError, setAdminReportsError] = useState('');
  const [adminReportsFilter, setAdminReportsFilter] = useState('message'); // 'message' | 'chat'
  
  // Admin Reports Filters
  const [adminReportsFilters, setAdminReportsFilters] = useState({
    dateFrom: '',
    dateTo: '',
    reporter: '',
    status: 'all', // 'all', 'pending', 'resolved'
    search: '',
    sortBy: 'date', // 'date', 'user', 'type'
    sortOrder: 'desc' // 'asc', 'desc'
  });

  const fetchAdminReports = useCallback(async (filters = adminReportsFilters, showLoading = true) => {
    try {
      if (showLoading) {
        setAdminReportsLoading(true);
      }
      setAdminReportsError('');
      
      // Build query parameters
      const params = new URLSearchParams();
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.reporter) params.append('reporter', filters.reporter);
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);
      params.append('sortBy', filters.sortBy);
      params.append('sortOrder', filters.sortOrder);
      
      const res = await fetch(`${API_BASE_URL}/api/notifications/reports?${params.toString()}`, { 
        credentials: 'include' 
      });
      const data = await res.json();
      if (data?.success) setAdminReports(data.reports || []);
      else setAdminReportsError(data?.message || 'Failed to load reports');
    } catch (_) {
      setAdminReportsError('Network error while loading reports');
    } finally {
      if (showLoading) {
        setAdminReportsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (showAdminReportsModal) fetchAdminReports();
  }, [showAdminReportsModal, fetchAdminReports]);

  // Debounced filter application for admin reports
  useEffect(() => {
    if (!showAdminReportsModal) return;
    
    const timeoutId = setTimeout(() => {
      fetchAdminReports(adminReportsFilters, false); // Don't show loading for debounced calls
    }, 500); // 500ms delay

    return () => clearTimeout(timeoutId);
  }, [adminReportsFilters, showAdminReportsModal, fetchAdminReports]);

  // Prevent background scroll when any Reports modal is open
  useEffect(() => {
    const shouldLock = showAdminReportsModal || false; // appointment-scoped handled in row component
    const previousOverflow = document.body.style.overflow;
    if (shouldLock) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = previousOverflow || '';
    }
    return () => {
      document.body.style.overflow = previousOverflow || '';
    };
  }, [showAdminReportsModal]);



  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading appointments...</p>
      </div>
    </div>
  );

  if (!Array.isArray(appointments)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-100">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Session expired or unauthorized</h2>
          <p className="text-gray-700 mb-4">Please sign in again to access admin appointments.</p>
          <Link to="/sign-in" className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors">Go to Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 py-10 px-2 md:px-8">
        <div className="max-w-7xl mx-auto mb-4 flex justify-end">
        <a href="/admin/payments" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M2 7a2 2 0 012-2h16a2 2 0 012 2v3H2V7z" /><path d="M2 12h20v5a2 2 0 01-2 2H4a2 2 0 01-2-2v-5zm4 3a1 1 0 100 2h6a1 1 0 100-2H6z" /></svg>
          Go to Payments
        </a>
      </div>
      <ToastContainer
        position="top-center"
        autoClose={2000}
        closeOnClick
        containerClassName="!z-[100]"
        toastOptions={{
          style: { fontSize: '0.9rem', borderRadius: '8px', boxShadow: '0 2px 8px #0001' }
        }}
      />
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg p-6">
        {/* Responsive button group: compact on mobile, original on desktop */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-6">
          <h3 className="text-2xl sm:text-3xl font-extrabold text-blue-700 drop-shadow">
            {showArchived 
              ? `Archived Appointments (${archivedAppointmentsWithComments.length})`
              : `All Appointments (${appointmentsWithComments.length})`}
          </h3>
          <div className="flex flex-row w-full sm:w-auto gap-2 sm:gap-4 justify-center sm:justify-end mt-2 sm:mt-0">
            {/* Reports icon (admin-wide, top bar) */}
            <button
              onClick={() => {
                setShowAdminReportsModal(true);
              }}
              className="bg-white text-red-600 px-3 py-2 rounded-md hover:bg-red-50 transition-all font-semibold shadow-md flex items-center justify-center gap-2 text-xs sm:text-base sm:px-4 sm:py-2 sm:rounded-lg w-1/2 sm:w-auto"
              title="View all reports"
              aria-label="View all reports"
            >
              <FaFlag className="text-red-600" />
              <span className="hidden sm:inline">Reports</span>
            </button>
            <button
              onClick={handleManualRefresh}
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-2.5 py-1.5 rounded-md hover:from-blue-600 hover:to-purple-600 transition-all font-semibold shadow-md text-xs sm:text-base sm:px-4 sm:py-2 sm:rounded-lg w-1/2 sm:w-auto"
              title="Refresh appointments"
            >
              Refresh
            </button>
            <button
              onClick={() => {
                setShowArchived(!showArchived);
                setCurrentPage(1); // Reset to first page when switching
                setArchivedCurrentPage(1); // Reset archived page to first page when switching
              }}
              className={`bg-gradient-to-r text-white px-2.5 py-1.5 rounded-md transition-all transform hover:scale-105 shadow-lg font-semibold flex items-center gap-1 sm:gap-2 text-xs sm:text-base w-1/2 sm:w-auto sm:px-6 sm:py-3 sm:rounded-lg justify-center ${
                showArchived 
                  ? 'from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600' 
                  : 'from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700'
              }`}
            >
              {showArchived ? (
                <>
                  <FaUndo /> <span>Active Appointments</span>
                </>
              ) : (
                <>
                  <FaArchive /> <span>Archived Appointments ({archivedAppointments.length})</span>
                </>
              )}
            </button>
          </div>
        </div>
        
        <p className="text-center text-gray-600 mb-6">
          {showArchived 
            ? "View and manage archived appointments. You can unarchive them to move them back to active appointments."
            : "💡 High data traffic may cause this page to slow down or stop working. Please refresh to continue using it normally.⚠️ Chats are encrypted and secure. View only for valid purposes like disputes or fraud checks. Unauthorized access or sharing is prohibited and will be logged."
          }
        </p>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex items-center gap-2">
              <label className="font-semibold text-sm">Status:</label>
              <select
                className="border rounded px-2 py-1 focus:outline-none focus:ring focus:ring-blue-200 text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Appointments</option>
                <option value="pending">Pending Appointments</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
                <option value="cancelledByBuyer">Cancelled by Buyer</option>
                <option value="cancelledBySeller">Cancelled by Seller</option>
                <option value="cancelledByAdmin">Cancelled by Admin</option>
                <option value="deletedByAdmin">Deleted by Admin</option>
                <option value="completed">Completed</option>
                <option value="noShow">No Show</option>
                <option value="outdated">Outdated</option>
              </select>
            </div>
            {/* Role filter removed for streamlined UI */}
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex items-center gap-2">
              <label className="font-semibold text-sm">From:</label>
              <input
                type="date"
                className="border rounded px-2 py-1 focus:outline-none focus:ring focus:ring-blue-200 text-sm"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                max={endDate || undefined}
              />
              <label className="font-semibold text-sm">To:</label>
              <input
                type="date"
                className="border rounded px-2 py-1 focus:outline-none focus:ring focus:ring-blue-200 text-sm"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                min={startDate || undefined}
              />
            </div>
            <div className="flex items-center gap-2">
              <FaSearch className="text-gray-500 hover:text-blue-500 transition-colors duration-200" />
              <input
                type="text"
                className="border rounded px-2 py-1 focus:outline-none focus:ring focus:ring-blue-200 text-sm flex-1"
                placeholder="Search by email, property, or username..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>
        
        {showArchived ? (
          // Archived Appointments Section
            archivedAppointmentsWithComments.length === 0 ? (
              <div className="text-center text-gray-500 text-lg">No archived appointments found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse rounded-lg overflow-hidden">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-100 to-gray-200">
                      <th className="border p-2">Date & Time</th>
                      <th className="border p-2">Property</th>
                      <th className="border p-2">Payment</th>
                      <th className="border p-2">Buyer</th>
                      <th className="border p-2">Seller</th>
                      <th className="border p-2">Purpose</th>
                      <th className="border p-2">Message</th>
                      <th className="border p-2">Status</th>
                      <th className="border p-2">Actions</th>
                      <th className="border p-2">Connect</th>
                    </tr>
                  </thead>
                  <tbody>
                    {archivedAppointmentsWithComments.map((appt) => (
                      <AdminAppointmentRow
                        key={appt._id}
                        appt={appt}
                        currentUser={currentUser}
                        handleAdminCancel={handleAdminCancel}
                        handleReinitiateAppointment={handleReinitiateAppointment}
                        handleArchiveAppointment={handleArchiveAppointment}
                        handleUnarchiveAppointment={handleUnarchiveAppointment}
                        onUserClick={handleUserClick}
                        isArchived={true}
                        copyMessageToClipboard={copyMessageToClipboard}
                        updateAppointmentComments={updateAppointmentComments}
                        // Modal states
                        showCancelModal={showCancelModal}
                        setShowCancelModal={setShowCancelModal}
                        showReinitiateModal={showReinitiateModal}
                        setShowReinitiateModal={setShowReinitiateModal}
                        showArchiveModal={showArchiveModal}
                        setShowArchiveModal={setShowArchiveModal}
                        showUnarchiveModal={showUnarchiveModal}
                        setShowUnarchiveModal={setShowUnarchiveModal}
                        appointmentToHandle={appointmentToHandle}
                        setAppointmentToHandle={setAppointmentToHandle}
                        cancelReason={cancelReason}
                        setCancelReason={setCancelReason}
                        confirmAdminCancel={confirmAdminCancel}
                        confirmReinitiate={confirmReinitiate}
                        confirmArchive={confirmArchive}
                        confirmUnarchive={confirmUnarchive}
                        // Reactions props
                        showReactionsBar={showReactionsBar}
                        setShowReactionsBar={setShowReactionsBar}
                        reactionsMessageId={reactionsMessageId}
                        setReactionsMessageId={setReactionsMessageId}
                        showReactionsEmojiPicker={showReactionsEmojiPicker}
                        setShowReactionsEmojiPicker={setShowReactionsEmojiPicker}
                        reactionEmojiSearchTerm={reactionEmojiSearchTerm}
                        setReactionEmojiSearchTerm={setReactionEmojiSearchTerm}
                        getFilteredEmojis={getFilteredEmojis}
                        toggleReactionsBar={toggleReactionsBar}
                        toggleReactionsEmojiPicker={toggleReactionsEmojiPicker}
