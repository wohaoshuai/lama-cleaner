import React, { useState, useEffect } from 'react'
import useResolution from '../../hooks/useResolution'

type FileSelectProps = {
  onSelection: (file: File) => void
}

export default function FileSelect(props: FileSelectProps) {
  const { onSelection } = props

  const [dragHover, setDragHover] = useState(false)
  const [uploadElemId] = useState(`file-upload-${Math.random().toString()}`)

  const resolution = useResolution()

  useEffect(() => {
    const receiveMessage = (event: MessageEvent) => {
      // Check the origin of the message
      if (event.origin !== 'http://localhost:3000') {
        return
      }

      // Access the message content
      const message = event.data
      if (message) {
        onFileSelected(message)
      }

      // Handle the received message
      console.log('Received message in iframe:', message)
    }

    // Add event listener for the 'message' event
    window.addEventListener('message', receiveMessage)

    // Clean up the event listener when component unmounts
    // return () => {
    //   window.removeEventListener('message', receiveMessage)
    // }
  }, [])

  function onFileSelected(file: File) {
    console.log('onFileSeme', onFileSelected)
    if (!file) {
      return
    }
    // Skip non-image files
    const isImage = file.type.match('image.*')
    if (!isImage) {
      return
    }
    try {
      // Check if file is larger than 20mb
      if (file.size > 20 * 1024 * 1024) {
        throw new Error('file too large')
      }
      console.log('onFileSeme2', onFileSelected)
      onSelection(file)
    } catch (e) {
      // eslint-disable-next-line
      alert(`error: ${(e as any).message}`)
    }
  }

  async function getFile(entry: any): Promise<File> {
    return new Promise(resolve => {
      entry.file((file: File) => resolve(file))
    })
  }

  /* eslint-disable no-await-in-loop */

  // Drop handler function to get all files
  async function getAllFileEntries(items: DataTransferItemList) {
    const fileEntries: Array<File> = []
    // Use BFS to traverse entire directory/file structure
    const queue = []
    // Unfortunately items is not iterable i.e. no forEach
    for (let i = 0; i < items.length; i += 1) {
      queue.push(items[i].webkitGetAsEntry())
    }
    while (queue.length > 0) {
      const entry = queue.shift()
      if (entry?.isFile) {
        // Only append images
        const file = await getFile(entry)
        fileEntries.push(file)
      } else if (entry?.isDirectory) {
        queue.push(
          ...(await readAllDirectoryEntries((entry as any).createReader()))
        )
      }
    }
    return fileEntries
  }

  // Get all the entries (files or sub-directories) in a directory
  // by calling readEntries until it returns empty array
  async function readAllDirectoryEntries(directoryReader: any) {
    const entries = []
    let readEntries = await readEntriesPromise(directoryReader)
    while (readEntries.length > 0) {
      entries.push(...readEntries)
      readEntries = await readEntriesPromise(directoryReader)
    }
    return entries
  }

  /* eslint-enable no-await-in-loop */

  // Wrap readEntries in a promise to make working with readEntries easier
  // readEntries will return only some of the entries in a directory
  // e.g. Chrome returns at most 100 entries at a time
  async function readEntriesPromise(directoryReader: any): Promise<any> {
    return new Promise((resolve, reject) => {
      directoryReader.readEntries(resolve, reject)
    })
  }

  async function handleDrop(ev: React.DragEvent) {
    ev.preventDefault()
    const items = await getAllFileEntries(ev.dataTransfer.items)
    setDragHover(false)
    onFileSelected(items[0])
  }

  return (
    <label htmlFor={uploadElemId} className="file-select-label">
      <div
        className={[
          'file-select-container',
          dragHover ? 'file-select-label-hover' : '',
        ].join(' ')}
        onDrop={handleDrop}
        onDragOver={ev => {
          ev.stopPropagation()
          ev.preventDefault()
          setDragHover(true)
        }}
        onDragLeave={() => setDragHover(false)}
      >
        <input
          id={uploadElemId}
          name={uploadElemId}
          type="file"
          onChange={ev => {
            const file = ev.currentTarget.files?.[0]
            if (file) {
              onFileSelected(file)
            }
          }}
          accept="image/png, image/jpeg"
        />
        <p className="file-select-message">
          {resolution === 'desktop'
            ? 'Click here or drag an image file'
            : 'Tap here to load your picture'}
        </p>
      </div>
    </label>
  )
}
