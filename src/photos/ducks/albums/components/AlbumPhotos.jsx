import React, { Component } from 'react'
import { connect } from 'react-redux'
import { showModal, ModalManager } from 'react-cozy-helpers'
import { withRouter } from 'react-router'
import { translate } from 'cozy-ui/react/I18n'
import { ShareModal } from 'sharing'
import flow from 'lodash/flow'

import styles from '../../../styles/layout'

import AlbumToolbar from './AlbumToolbar'
import { AddToAlbumModal } from '..'

import PhotoBoard from 'photos/components/PhotoBoard'
import Topbar from 'photos/components/Topbar'
import Alerter from 'cozy-ui/react/Alerter'
import DestroyConfirm from 'photos/components/DestroyConfirm'
import QuitConfirm from 'photos/components/QuitConfirm'
import confirm from 'photos/lib/confirm'
import Selection from '../../selection'

class AlbumPhotos extends Component {
  state = {
    editing: false,
    showAddAlbumModal: false
  }

  showAddAlbumModal = () => {
    this.setState(state => ({ ...state, showAddAlbumModal: true }))
  }
  hideAddAlbumModal = () => {
    this.setState(state => ({ ...state, showAddAlbumModal: false }))
  }
  editAlbumName = () => {
    this.setState(state => ({ ...state, editing: true }))
  }

  renameAlbum = name => {
    if (name.trim() === '') {
      Alerter.error('Error.album_rename_abort')
      return
    } else if (name === this.props.album.name) {
      this.setState({ editing: false })
      return
    }

    let updatedAlbum = { ...this.props.album, name: name }
    this.props
      .updateAlbum(updatedAlbum)
      .then(() => {
        this.setState({ editing: false })
      })
      .catch(() => {
        Alerter.error('Error.generic')
      })
  }

  downloadAlbum = () => {
    const { album } = this.props
    this.context.client
      .collection('io.cozy.files')
      .downloadArchive(album.photos.data.map(({ _id }) => _id), album.name)
  }

  downloadPhotos = photos => {
    this.context.client
      .collection('io.cozy.files')
      .downloadArchive(photos.map(({ _id }) => _id), 'selected')
  }

  deleteAlbum = () => {
    const { t, router, album, deleteAlbum } = this.props
    return confirm(<DestroyConfirm t={t} albumName={album.name} />, () =>
      deleteAlbum(album)
        .then(() => {
          router.replace('albums')
          Alerter.success('Albums.remove_album.success', { name: album.name })
        })
        .catch(() => Alerter.error('Albums.remove_album.error.generic'))
    )
  }

  leaveAlbum = () => {
    const { t, router, album, deleteAlbum, leaveAlbum } = this.props
    return confirm(<QuitConfirm t={t} albumName={album.name} />, () =>
      leaveAlbum(album)
        .then(() => deleteAlbum(album))
        .then(() => {
          router.replace('albums')
          Alerter.success('Albums.quit_album.success', { name: album.name })
        })
        .catch(() => Alerter.error('Albums.quit_album.error.generic'))
    )
  }

  render() {
    console.log('this.props', this.props)
    /* if (!this.props.album || !this.props.album.photos || !this.props.photos) {
      return null
    } */
    const {
      t,
      router,
      album,
      shareAlbum,
      photos,
      hasMore,
      fetchMore
    } = this.props
    //console.log('test', album.photos)
    const { editing } = this.state
    const shared = {}
    return (
      <Selection
        actions={selection => ({
          'album-add': this.showAddAlbumModal,
          download: this.downloadPhotos,
          'album-remove': selected =>
            this.props.removePhotos(album, selected, selection.clear)
        })}
      >
        {(selected, active, selection) => (
          <div className={styles['pho-content-wrapper']}>
            {album.name &&
              album.photos.data && (
                <Topbar
                  viewName="albumContent"
                  albumName={album.name}
                  editing={editing}
                  onEdit={this.renameAlbum}
                >
                  <AlbumToolbar
                    t={t}
                    router={router}
                    album={album}
                    sharedWithMe={shared.withMe}
                    sharedByMe={shared.byMe}
                    readOnly={shared.readOnly}
                    onRename={this.editAlbumName}
                    downloadAlbum={this.downloadAlbum}
                    deleteAlbum={this.deleteAlbum}
                    leaveAlbum={this.leaveAlbum}
                    shareAlbum={shareAlbum}
                  />
                </Topbar>
              )}
            {this.state.showAddAlbumModal && (
              <AddToAlbumModal
                onDismiss={this.hideAddAlbumModal}
                onSuccess={selection.clear}
                photos={selected}
              />
            )}
            {photos && (
              <PhotoBoard
                lists={[{ photos: photos }]}
                selected={selected}
                photosContext="timeline"
                showSelection={active}
                onPhotoToggle={selection.toggle}
                onPhotosSelect={selection.select}
                onPhotosUnselect={selection.unselect}
                fetchStatus={photos.fetchStatus}
                hasMore={hasMore}
                fetchMore={fetchMore}
              />
            )}
            {this.renderViewer(this.props.children)}
            <ModalManager />
          </div>
        )}
      </Selection>
    )
  }

  renderViewer(children) {
    if (!children) return null
    return React.Children.map(children, child =>
      React.cloneElement(child, {
        photos: this.props.photos
      })
    )
  }

  componentDidUnmount() {
    this.props.selection.clear()
  }
}

const mapDispatchToProps = dispatch => ({
  shareAlbum: album =>
    dispatch(
      showModal(<ShareModal document={album} sharingDesc={album.name} />)
    )
})
/*AlbumPhotos.propTypes = {
  hasMore: Proptypes.bool,
  fetchMore: func
}*/
export default flow(
  connect(
    null,
    mapDispatchToProps
  ),
  withRouter,
  translate()
)(AlbumPhotos)
