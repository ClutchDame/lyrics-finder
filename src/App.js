import React, { useState, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'
import './styles.scss'

export default function App() {
  const ref = useRef(null)
  const [lyrics, setLyrics] = useState()
  const [artist, setArtist] = useState(null)
  const [chosenArtist, setChosenArtist] = useState()
  const [searchResults, setSearchResults] = useState([])
  const errorMessage = 'Sorry we could not find these lyrics'

  //Replace space with accepted characters
  const sanitizeStr = str => str.replace(/\s/, '%20')

  const getSuggestions = async search => {
    sanitizeStr(search)
    const SEARCH_API = `https://api.lyrics.ovh/suggest/${search}`

    const response = await fetch(SEARCH_API)
    const results = await response.json()

    return results
  }

  const getLyrics = async (artist, title) => {
    const [cleanArtist, cleanTitle] = [sanitizeStr(artist), sanitizeStr(title)]
    const LYRICS_API = `https://api.lyrics.ovh/v1/${cleanArtist}/${cleanTitle}`

    const response = await fetch(LYRICS_API)
    const lyrics = await response.json()

    return lyrics
  }

  const handleChange = e => {
    const search = e.target.value
    setChosenArtist(search)
    // when we have at least 3 characters typed in by user, start searching
    if (search.length > 2) {
      getSuggestions(search).then(({ error, data: results }) => {
        results && setSearchResults(results)
        error && console.log('boom error fetching suggestions -> ', error)
      })
    } else setSearchResults([])
  }

  const handleSuggestionClick = result => {
    setChosenArtist(
      `${result.artist.name} - ${
        result.title_short ? result.title_short : result.title
      }`
    )
    getLyrics(
      result.artist.name,
      // TODO: Test which is better btw title and title_short
      result.title_short ? result.title_short : result.title
    ).then(({ lyrics, error }) => {
      lyrics ? setLyrics(lyrics) : setLyrics(errorMessage)
      error && console.log('boom error fetching lyrics ->', error)
      setSearchResults([])
    })
    result.artist && setArtist(result.artist)
  }

  const handleKeyDown = (e, index, result) => {
    e.key === 'Enter' && handleSuggestionClick(result)
    e.key === 'Tab' &&
      index + 1 === searchResults.length &&
      ref.current.parentNode.firstChild.focus()
  }

  return (
    <>
      <h1>Lyrics finder</h1>
      <section>
        <input
          type="text"
          name="search"
          placeholder="Artist / Song"
          onChange={e => handleChange(e)}
          value={chosenArtist}
        />
        <ul tabIndex="-1" aria-expanded={!!searchResults?.length > 0}>
          {searchResults?.map((result, index) => {
            return (
              <li
                ref={ref}
                key={uuidv4()}
                tabIndex={0}
                onClick={e => handleSuggestionClick(result)}
                onKeyDown={e => handleKeyDown(e, index, result)}
              >
                {result.artist.name} -{' '}
                {result.title_short ? result.title_short : result.title}
              </li>
            )
          })}
        </ul>
      </section>
      {artist && lyrics && (
        <img
          alt="artist poster"
          src={artist.picture}
          srcset={`${artist.picture_medium} 250w, ${artist.picture_big} 500w`}
          sizes="20vmin"
        />
      )}
      <pre>{lyrics}</pre>
    </>
  )
}
