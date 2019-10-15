import React, { Component, useState, useEffect, useRef } from "react";
import "./App.css";
import SpotifyWebApi from "spotify-web-api-js";
import "styled-components/macro";
import _ from "lodash";
const spotifyApi = new SpotifyWebApi();

/* css theme */
const T={
  THEME_BG : "rgba(220, 220, 250, 1)",
  THEME_BG2 : "rgba(250, 250, 250, 1)",
 THEME_OVERLAY_BG : "rgba(230, 230, 230, 1)",
 SECTION_MARGIN : "10px",
 FIXED_SHADOW : "0px 0px 10px rgba(0, 0, 0, .3)",
 ICON_BG:"lightblue",
 ICON_HOVER_BG:"lightgreen",
 ICON_BORDER:"1px solid black",
 ICON_BORDER_RADIUS:"3px",
}

const App = props => {
  const getHashToken = () => {
    return getHashValue("access_token");
  };
  function getHashValue(key) {
    var matches = window.location.hash.match(new RegExp(key + "=([^&]*)"));
    return matches ? matches[1] : null;
  }

  const [token, setToken] = useState(null);
  const [saved, setSaved] = useState(null);
  const [nowPlaying, setNowPlaying] = useState({});
  const [app_playlist, setAppPlaylist] = useState(null);
  const [me, setMe] = useState(null);
  const [playing_track,setPlayingTrack] = useState(null);
  const [playing_album,setPlayingAlbum] = useState(null);
  const [playing_artists,setPlayingArtists] = useState(null);

  const getAppPlaylist= () => {
    spotifyApi.getUserPlaylists(me.id).then((response)=>{
    const selected = _.first(_.filter(response.items,(e)=>e.name=="SOUNDWALK"))
    if(selected){
      setAppPlaylist(selected)
    } else {
      spotifyApi.createPlaylist(me.id,{name:"SOUNDWALK"});
    }
  })
}

  useEffect(()=>{token&&spotifyApi.getMe().then(setMe) },[token])
  useEffect(() =>{
      token&&spotifyApi.getMyCurrentPlaybackState().then(
    (response)=>{
      if(!response){return}
      response.item&&spotifyApi.getTrack(response.item.id).then((response)=>setPlayingTrack(response))
      response.item&&spotifyApi.getAlbum(response.item.album.id).then(setPlayingAlbum)
      response.item &&
      setNowPlaying({
        name: response.item.name,
        trackId: response.item.id,
        albumId: response.item.album.id,
        artists: response.item.artists,
        albumArt: response.item.album.images[0].url,
        context: response.context,
      })
  },[token])

  }, [token]);
     useEffect(()=>{
     getHashToken()&&spotifyApi.setAccessToken(getHashToken())
     setToken(getHashToken())
  })
  useEffect(()=>{token&&me&&getAppPlaylist()},[token,me])
  useEffect(()=>{if(token){
    spotifyApi.getMySavedTracks({ limit: 10 }).then(response => {
      setSaved(response);
    });
  }},[token])

  useEffect(()=>{playing_track&&spotifyApi.getArtists([_.map(playing_track.artists,(e)=>e.id)]).then((response)=>setPlayingArtists(response.artists))},[playing_track])



  
  

  // if (token && needs_fetch_saved) {
  
  // }

  console.log(nowPlaying)
  console.log(nowPlaying.context)



  return (
    <div className="App"
    css={`
    .one-line{
      white-space:nowrap;
      text-overflow:ellipsis;
      overflow:hidden;
    }
    .icon-group{
      display:inline-flex;
      font-size:50%;
      .icon{
        width:1.5em;
        height:1.5em;
        margin-left:.25em;
        margin-right:.25em;
      }
    }
    .icon{
      background-color:${T.ICON_BG};
      &:hover{background-color:${T.ICON_HOVER_BG};}
      border:${T.ICON_BORDER};
      border-radius:${T.ICON_BORDER_RADIUS};
      cursor:pointer;
      display:flex;
      justify-content:center;
      align-items:center;
    }`}
    >
      <a href="http://localhost:8888"> Login to Spotify </a>
      <div
        css={`
          position: fixed;
          bottom: 0px;
          right: 0px;
          left: 0px;
          background: ${T.THEME_BG};
          box-shadow: ${T.FIXED_SHADOW};
        `}
      >
        {" "}
        {token && <CurrentTrack />}
      </div>
      {nowPlaying &&playing_track && app_playlist && (<div
        css={`
          position: fixed;
          right: 0px;
          top: 50%;
          transform: translate(0%, -50%);
          width: 200px;
          background-color: ${T.THEME_OVERLAY_BG};
          box-shadow: ${T.FIXED_SHADOW};
          li {
            list-style: none;
          }
          >:nth-child(even){
            background-color:${T.THEME_BG2};
          }
          >*{
            margin-top:.5em;
            padding:.25em;
          }
        `}
      >




{playing_album  &&
           <TrackListView
             trackId={playing_track.id}
             playlistId={app_playlist.id}
             type="album"
             uri={playing_album.uri}
   />} 

{app_playlist &&
           <TrackListView
             trackId={playing_track.id}
             playlistId={app_playlist.id}
             {...app_playlist}
   />}

{playing_artists &&_.map(playing_artists,(e,i)=>(<ArtistView key={i} artistId={e.id} />))}   

      </div>)}
      {token && saved && saved.items && <SongList items={saved.items} />}
    </div>
  );
};

const ArtistView = ({artistId})=>{
    const [albums,setAlbums] = useState()
    const [artist,setArtist] = useState()

  

    useEffect(()=>{spotifyApi.getArtistAlbums(artistId).then((response)=>{response&&setAlbums(response.items)})},[artistId])
    useEffect(()=>{spotifyApi.getArtist(artistId).then(setArtist)},[artistId]) 

    return  (<div><div>🎤{artist?artist.name:artistId}</div>
                 <div>{albums?albums.slice(0,5).map((e,i)=><div className="one-line" key={i}>{e.name}</div>):null}
                 </div></div>)
}

const TrackListView = ({ uri,type, trackId ,playlistId}) => {
  const [play_context, setPlayContext] = useState();
  const [tracks, setTracks] = useState();

  let {
    groups: { id }
  } = /[^:]*:(?<type>[^:]*):(?<id>.*)/.exec(uri);

  useEffect(() => {
    switch (type) {
      case "album":
        spotifyApi.getAlbum(id).then((response)=>{
          setPlayContext(response)
          setTracks(response.tracks.items)
        });
        break;
      case "playlist":
          spotifyApi.getPlaylist(id).then((response)=>{
            setPlayContext(response)
            setTracks(_.map(response.tracks.items,"track"))
          });
        break; 
    }
  },[]);

  return (play_context?<div css={` max-height:30vh; overflow:scroll;`}>
          <span><div>{type=="album"?"💿":"☰"}{`${play_context.name}`}</div></span>
          {tracks && tracks.map((e, i) => (
                  <div
                    className="one-line"
                    css={`${e.id == trackId && "font-weight:bold;"}`}
                    key={i}
                  >
                    <div className="icon-group">
                    <div className="icon" onClick={() => spotifyApi.play({context_uri:uri,offset:{uri:e.uri}})}>▷</div>
                    <div className="icon" onClick={() => spotifyApi.addTracksToPlaylist(playlistId,[e.uri])}>+</div>
                    </div>
                    {i}--{e.name}
                    </div>
                ))}
    </div>
  :null)
};

const SongFeatures = props => {
  const [features, setFeatures] = useState({});
  const [needs_fetch, setNeedsFetch] = useState(true);
  if (needs_fetch) {
    spotifyApi
      .getAudioFeaturesForTrack(props.trackId)
      .then(response => setFeatures(response));
    setNeedsFetch(false);
  }
  
  const { acousticness, danceability, energy, liveness } = features;
  return (
    <div
      css={`
        width: 20vw;
        background-color: ${T.THEME_BG};
        margin: 10px;
        dd,
        dt {
          display: inline;
        }
        dd {
          margin-left: 1em;
        }
        dt {
          font-weight: bold;
        }
        h1 {
          font-size: 150%;
        }
        h2 {
          font-size: 100%;
        }
      `}
    >
      <h1 onClick={e => {spotifyApi.play({ uris: [props.track.uri] })}}>
        {props.track.name}
      </h1>
      <h3>
        <a href="https://api.spotify.com/v1/artists/5uh8Bhewltd8j0TLZjNImc">
          {props.track.artists[0].name}
        </a>
      </h3>
      {/*_.map({danceability,liveness,acousticness,energy},(e,k)=><dl key={k}><dt>{k}</dt><dd>{Math.round(e*100)}</dd></dl>)*/}
    </div>
  );
};

const SongList = props => {
  return (
    <div
      css={`
        display: flex;
        text-align: left;
        flex-wrap: wrap;
      `}
    >
      {props.items.map((e, i) => (
        <div key={i}>
          <SongFeatures trackId={e.track.id} track={e.track}></SongFeatures>
        </div>
      ))}
    </div>
  );
};

const CurrentTrack = props => {
  const [playing_track, setPlayingTrack] = useState();
  const [playback_state, setPlaybackState] = useState();
  const [needs_refresh, setNeedsRefresh] = useState(true);
  const [song_progress, setSongProgress] = useState(true);
  const [app_timestamp, setAppTimestep] = useState(null);
  const [song_analysis, setSongAnalysis] = useState(null);
  const [beat_number, setBeatNumber] = useState(null);
  const [downbeat_number, setDownbeatNumber] = useState(null);
  const [bar_number, setBarNumber] = useState(null);
  //const [playing_state, setPlayingState] = useState(null);
  const [section_number, setSectionNumber] = useState(null);

  playing_track &&
    playing_track &&
    song_progress > playing_track.duration_ms + 1000 &&
    false &&
    setNeedsRefresh(true);


  const refresh =()=>{
    spotifyApi.getMyCurrentPlayingTrack().then(response => {
      response&&response.item?setPlayingTrack(response.item):setPlayingTrack(null);
      setAppTimestep(new Date().getTime());
    });
    spotifyApi.getMyCurrentPlaybackState().then(setPlaybackState)
  }


  // useEffect(refresh)

  useEffect(() => {
    playing_track &&spotifyApi.getAudioAnalysisForTrack(playing_track.id).then(setSongAnalysis);
  }, [playing_track]);


  /** short-running interval polls to make sure that we're still playing the right song */
  useInterval(()=>{ refresh() },5000)


  /** long-running interval checks beats etc */
  useInterval(() => {
    playing_track && playback_state &&
      setSongProgress( playback_state.progress_ms + (new Date().getTime() - app_timestamp) );

    if (playing_track  && playback_state && song_analysis) {
      const barnum = Math.max(
        _.sortedIndexBy(
          song_analysis.bars,
          { start: song_progress / 1000 },
          x => x.start
        ) - 1,
        0
      );
      setBarNumber(barnum);
      setBeatNumber(
        Math.max(
          _.sortedIndexBy(
            song_analysis.beats,
            { start: song_progress / 1000 },
            x => x.start
          ) - 1
        ),
        0
      );
      setDownbeatNumber(
        Math.max(
          _.sortedIndexBy(
            song_analysis.beats,
            {
              start:
                song_analysis.bars[
                  Math.min(barnum, song_analysis.bars.length - 1)
                ].start - 0.01
            },
            x => x.start
          )
        ),
        0
      );
      setSectionNumber(
        Math.max(
          _.sortedIndexBy(
            song_analysis.sections,
            { start: song_progress / 1000 },
            x => x.start
          ) - 1
        ),
        0
      );
    }
  }, 200);

  return playing_track ? (
    <div>
      <div
        css={`
          display: flex;
          height: 20px;
          > * {
            width: 10em;
          }
        `}
      >

        <div className="track-name">{playing_track.name}</div>
        <div className="icon-group">
        <div className="icon" onClick={() => spotifyApi.skipToPrevious()}>⏮</div>
        <div className="icon" onClick={() => spotifyApi.pause()}>⏸️</div>
        <div className="icon" onClick={() => spotifyApi.play()}>▶️</div>
        <div className="icon" onClick={() => spotifyApi.skipToNext()}>⏭</div>
        </div>

        <div className="analysis" css="width:100px;">
          <div
            css={`
              width: ${20 * (beat_number - downbeat_number + 1)}px;
              height: 100%;
              background-color: rgba(
                ${(beat_number - downbeat_number) * 50},
                0,
                0,
                1
              );
            `}
          ></div>
        </div>
      </div>
      <div css="display:flex; background-color:red; width:100%; height:20px; position:relative;">
        {song_analysis &&
          song_analysis.sections.map((e, i) => (
            <div
              className="HI"
              css="cursor:pointer;"
              onClick={e => {
                spotifyApi
                  .seek(
                    Math.round(
                      playing_track.duration_ms * (e.clientX / window.innerWidth)
                    )
                  )
                  .then(() => {
                    window.setTimeout(() => setNeedsRefresh(true), 100);
                  });
              }}
              key={i}
              css={`height:100%; 
width:${Math.round((e.duration / playing_track.duration_ms) * 1000 * 100)}%; 
border-left:1px solid gray;
background-color:${
                i == section_number
                  ? "blue"
                  : i == section_number + 1
                  ? "lightgreen"
                  : "lightgray"
              }; 
  }`}
            ></div>
          ))}
        {song_analysis && (
          <div
            css={`
              height: 100%;
              width: 1px;
              background-color: black;
              left: ${(song_progress / playing_track.duration_ms) * 100}%;
              position: absolute;
              top: 0px;
            `}
          />
        )}
      </div>
    </div>
  ) : null;
};

function useInterval(callback, delay) {
  const savedCallback = useRef();

  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval.
  useEffect(() => {
    function tick() {
      savedCallback.current();
    }
    if (delay !== null) {
      let id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}

export default App;
