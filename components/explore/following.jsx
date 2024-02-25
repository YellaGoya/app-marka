'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRecoilState } from 'recoil';
import { useSession } from 'next-auth/react';
import clsx from 'clsx';

import { followingCountState } from 'lib/recoil';
import { getUsersByTag, getFollowingCount, getFollowingList, addFollowing, deleteFollowing } from 'lib/api/user';

import Button from 'components/common/button';
import PeopleRoundedIcon from '@mui/icons-material/PeopleRounded';
import BackspaceRoundedIcon from '@mui/icons-material/BackspaceRounded';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';

import { useDebouncedCallback } from 'use-debounce';

import global from 'app/global.module.css';
import css from './following.module.css';

const Following = () => {
  const { status } = useSession();

  const [isLoaded, setIsLoaded] = useState(false);
  const [followingCount, setFollowingCount] = useRecoilState(followingCountState);

  const [searchText, setSearchText] = useState('');

  const [toggleFollowing, setToggleFollowing] = useState(false);
  const [toggleSearch, setToggleSearch] = useState(false);

  const followingButtonRef = useRef(null);
  const followingListRef = useRef(null);
  const searchButtonRef = useRef(null);
  const searchListRef = useRef(null);

  useEffect(() => {
    if (status === 'authenticated') {
      try {
        refreshFollowingCount();
        setIsLoaded(true);
      } catch {}
    }
  }, [status]);

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

  const refreshFollowingCount = async () => {
    try {
      setFollowingCount(await getFollowingCount());
    } catch {}
  };

  const toggleFollowingHandler = () => {
    setToggleFollowing((prev) => !prev);
  };

  const searchTagHandler = (tag) => {
    setToggleSearch(Boolean(tag));
  };

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
            onClick={() => {
              setToggleSearch(true);
            }}
          />
          <Button ref={followingButtonRef} onClick={toggleFollowingHandler}>
            <PeopleRoundedIcon />
            <span>{followingCount}</span>
          </Button>
        </span>
      </section>
      {toggleFollowing && <FollowingList followingListRef={followingListRef} refreshFollowingCount={refreshFollowingCount} />}
      {toggleSearch && <SearchResultList text={searchText} searchListRef={searchListRef} refreshFollowingCount={refreshFollowingCount} />}
    </div>
  );
};

const FollowingList = ({ refreshFollowingCount, followingListRef }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  const [following, setFollowing] = useState([]);
  const [followingPageNumber, setFollowingPageNumber] = useState(0);

  const observer = useRef();

  const lastFollowingRef = useCallback(
    (node) => {
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          getFollowing();
        }
      });
      if (node) observer.current.observe(node);
    },
    [status, followingPageNumber],
  );

  useEffect(() => {
    getFollowing();
  }, [status]);

  const getFollowing = async () => {
    try {
      const res = await getFollowingList(followingPageNumber);

      setFollowing((prevFollowing) => (followingPageNumber ? [...prevFollowing, ...res.following] : res.following));

      if (followingPageNumber === 0) {
        setIsLoaded(true);
      }

      setFollowingPageNumber(res.newPageNumber);
    } catch {}
  };

  const unFollowHandler = async (followingId) => {
    try {
      await deleteFollowing(followingId);
      setFollowing((prev) => {
        return prev.filter((following) => following.following_id !== followingId);
      });

      refreshFollowingCount();
    } catch {}
  };

  return (
    <section ref={followingListRef} className={clsx(global.cardContainer, css.searchContainer, { [global.loaded]: isLoaded })}>
      <ul className={css.tagList}>
        {following && following.length > 0 ? (
          following.map((user, idx) => {
            return (
              <li key={`following-${user.user_id}`} ref={following.length - 1 === idx ? lastFollowingRef : null}>
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
          })
        ) : (
          <li style={{ paddingRight: 0 }}>
            <h4 style={{ opacity: '0.5', textAlign: 'center' }}>현재 팔로우가 없습니다.</h4>
          </li>
        )}
      </ul>
    </section>
  );
};

const SearchResultList = ({ text, refreshFollowingCount, searchListRef }) => {
  const { data: session } = useSession();

  const userId = session.user.id;

  const [isLoaded, setIsLoaded] = useState(false);

  const [searchResult, setSearchResult] = useState(null);
  const [searchPageNumber, setSearchPageNumber] = useState(0);

  const observer = useRef();

  const lastSearchRef = useCallback(
    (node) => {
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          getSearchResult(text);
        }
      });
      if (node) observer.current.observe(node);
    },
    [status, searchPageNumber],
  );

  useEffect(() => {
    if (text) {
      setSearchPageNumber(0);
      refreshSearchResult(text);
    }
  }, [text]);

  const refreshSearchResult = useDebouncedCallback(async (text) => {
    getSearchResult(text);
  }, 300);

  const getSearchResult = async (text) => {
    try {
      const res = await getUsersByTag(text, searchPageNumber);

      setSearchResult((prevSearchResult) => (searchPageNumber ? [...prevSearchResult, ...res.result] : res.result));

      if (searchPageNumber === 0) {
        setIsLoaded(true);
      }

      setSearchPageNumber(res.newPageNumber);
    } catch {}
  };

  const toggleFollowingHandler = async (idx) => {
    let { following_id, user_id } = searchResult[idx];
    const isDelete = Boolean(following_id);

    try {
      if (isDelete) await deleteFollowing(following_id);
      else following_id = await addFollowing(user_id);

      setSearchResult((prev) => {
        const newResult = [...prev];
        newResult[idx].following_id = isDelete ? 0 : following_id;

        return newResult;
      });

      refreshFollowingCount();
    } catch {}
  };

  return (
    <section ref={searchListRef} className={clsx(global.cardContainer, css.searchContainer, { [global.loaded]: isLoaded })}>
      <ul className={css.tagList}>
        {searchResult && searchResult.length > 0 ? (
          searchResult.map((user, idx) => {
            return (
              <li
                key={`result-${user.user_id}`}
                ref={searchResult.length - 1 === idx ? lastSearchRef : null}
                className={clsx({ [css.followedItem]: user.following_id })}
              >
                <h4>
                  {user.tag}&nbsp;
                  <span>({user.email})</span>
                </h4>

                {user.user_id !== userId && (
                  <Button
                    onClick={() => {
                      toggleFollowingHandler(idx);
                    }}
                  >
                    {user.following_id ? <BookmarkIcon /> : <BookmarkBorderIcon />}
                  </Button>
                )}
              </li>
            );
          })
        ) : (
          <li style={{ paddingRight: 0 }}>
            <h4 style={{ opacity: '0.5', textAlign: 'center' }}>검색 결과가 없습니다.</h4>
          </li>
        )}
      </ul>
    </section>
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
