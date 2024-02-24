'use client';

import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import clsx from 'clsx';

import { getUsersByTag, getFollowingList, addFollowing, deleteFollowing } from 'lib/api/user';

import Button from 'components/common/button';
import PeopleRoundedIcon from '@mui/icons-material/PeopleRounded';
import BackspaceRoundedIcon from '@mui/icons-material/BackspaceRounded';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';

import { useDebouncedCallback } from 'use-debounce';

import global from 'app/global.module.css';
import css from './following.module.css';
import { set } from 'zod';

const Following = () => {
  const { data: session, status } = useSession();

  const [isLoaded, setIsLoaded] = useState(false);
  const [following, setFollowing] = useState([]);
  const [followingNumb, setFollowingNumb] = useState('');

  const [searchText, setSearchText] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searchPageNumber, setSearchPageNumber] = useState(0);

  const [toggleFollowing, setToggleFollowing] = useState(false);
  const [toggleSearch, setToggleSearch] = useState(false);

  const followingButtonRef = useRef(null);
  const followingListRef = useRef(null);
  const searchButtonRef = useRef(null);
  const searchListRef = useRef(null);

  useOutsideAlerter(
    () => {
      setToggleFollowing(false);
    },
    followingListRef,
    followingButtonRef,
  );

  useOutsideAlerter(
    () => {
      setToggleSearch(false);
    },
    searchListRef,
    searchButtonRef,
  );

  useEffect(() => {
    if (status === 'authenticated') {
      getFollowing();
    }
  }, [status]);

  useEffect(() => {
    if (following.length === 0) setToggleFollowing(false);
    setFollowingNumb(following.length);
  }, [following]);

  const getFollowing = async () => {
    try {
      const result = await getFollowingList(searchPageNumber);
      setSearchPageNumber(result.newPageNumber);
      setFollowingNumb(result.following.length);
      setFollowing(result.following);
      setIsLoaded(true);
    } catch {}
  };

  const toggleFollowingHandler = () => {
    if (!toggleFollowing) {
      if (following.length === 0) return;
      followingListRef.current.style.right = followingButtonRef.current.clientWidth + 15 + 'px';
    }

    setToggleFollowing((prev) => !prev);
  };

  const searchTagHandler = useDebouncedCallback(async (tag) => {
    if (!tag) {
      setSearchResult(null);
      setToggleSearch(false);
      return;
    }

    try {
      const result = await getUsersByTag(tag);
      setSearchResult(result);
      setToggleSearch(true);
    } catch {}
  }, 500);

  return (
    <div style={{ position: 'relative' }}>
      <section className={clsx(global.cardContainer, { [global.loaded]: isLoaded })}>
        <span className={css.search}>
          <input
            ref={searchButtonRef}
            type="text"
            name="tag"
            autoComplete="off"
            placeholder="태그 검색"
            onChange={(e) => {
              searchTagHandler(e.target.value);
              setSearchText(e.target.value);
            }}
            onFocus={() => {
              setToggleSearch(true);
            }}
          />
          <Button ref={followingButtonRef} onClick={toggleFollowingHandler}>
            <PeopleRoundedIcon />
            <span>{followingNumb}</span>
          </Button>
        </span>
      </section>
      {following.length > 0 && (
        <section ref={followingListRef} className={clsx(global.cardContainer, css.searchContainer, { [global.loaded]: toggleFollowing })}>
          <FollowingList following={following} setFollowing={setFollowing} />
        </section>
      )}
      {searchText && (
        <section ref={searchListRef} className={clsx(global.cardContainer, css.searchContainer, { [global.loaded]: toggleSearch })}>
          <SearchResultList result={searchResult} setSearchResult={setSearchResult} getFollowing={getFollowing} />
        </section>
      )}
    </div>
  );
};

const FollowingList = ({ following, setFollowing }) => {
  const unFollowHandler = async (followingId) => {
    try {
      await deleteFollowing(followingId);
      setFollowing((prev) => {
        return prev.filter((following) => following.following_id !== followingId);
      });
    } catch {}
  };

  return (
    <ul className={css.tagList}>
      {following &&
        following.map((user) => {
          return (
            <li key={`following-${user.user_id}`}>
              <h4>
                {user.tag}&nbsp;
                <span>({user.email})</span>
              </h4>

              <Button
                onClick={() => {
                  unFollowHandler(user.following_id);
                }}
              >
                <BackspaceRoundedIcon />
              </Button>
            </li>
          );
        })}
    </ul>
  );
};

const SearchResultList = ({ result, setSearchResult, getFollowing }) => {
  const toggleFollowing = async (idx) => {
    let { following_id, user_id } = result[idx];
    const isDelete = Boolean(following_id);

    try {
      if (isDelete) await deleteFollowing(following_id);
      else following_id = await addFollowing(user_id);

      setSearchResult((prev) => {
        const newResult = [...prev];
        newResult[idx].following_id = isDelete ? 0 : following_id;

        return newResult;
      });

      getFollowing();
    } catch {}
  };

  return (
    <ul className={css.tagList}>
      {result && result.length > 0 ? (
        result.map((user, idx) => {
          return (
            <li key={`result-${user.user_id}`} className={clsx({ [css.followedItem]: user.following_id })}>
              <h4>
                {user.tag}&nbsp;
                <span>({user.email})</span>
              </h4>

              <Button
                onClick={() => {
                  toggleFollowing(idx);
                }}
              >
                {user.following_id ? <BookmarkIcon /> : <BookmarkBorderIcon />}
              </Button>
            </li>
          );
        })
      ) : (
        <li>
          <h4 style={{ opacity: '0.5', textAlign: 'center' }}>검색 결과가 없습니다.</h4>
        </li>
      )}
    </ul>
  );
};

const useOutsideAlerter = (onOutsideClick, ref, extraRef) => {
  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target) && (!extraRef || (extraRef.current && !extraRef.current.contains(event.target)))) {
        onOutsideClick();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [ref, onOutsideClick]);
};

export default Following;
